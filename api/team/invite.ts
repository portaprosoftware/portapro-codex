import type {
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
} from "http";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/integrations/supabase/types.js";

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "dispatcher", "driver", "customer"]),
  phone: z.string().optional(),
  organizationId: z.string().optional(),
  organizationSlug: z.string().optional(),
  redirectBase: z.string().url().optional(),
});

type ApiRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
  headers: IncomingHttpHeaders;
};

type ApiResponse = ServerResponse;

const sendJson = (res: ApiResponse, status: number, body: unknown) => {
  if (res.headersSent) return;

  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const formatError = (
  res: ApiResponse,
  message: string,
  status = 400,
  details?: unknown
) => {
  console.error("[invite] error:", message, details);
  sendJson(res, status, { success: false, error: message, details });
};

const parseJsonBody = async (req: ApiRequest): Promise<unknown> => {
  if (req.body && typeof req.body === "object" && !(req.body instanceof Buffer)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString("utf8"));
  }

  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    // 🔁 Lazy-load everything that can possibly throw at module load time,
    // so any failure is caught and turned into JSON instead of Vercel HTML.
    const [
      { loadOrganizationFromRequest },
      { loadServerEnv },
      { buildTenantUrl, getAppRootUrl },
      { tenantTable },
      { AuthorizationError, requireRole },
      { clerkClient, verifyClerkSessionToken },
    ] = await Promise.all([
      import("./organization-loader.js"),
      import("../../src/lib/config/server-env.js"),
      import("../../src/lib/config/domains.js"),
      import("../../src/lib/db/tenant.js"),
      import("../../src/lib/authz/requireRole.js"),
      import("../../src/lib/server/clerkClient.js"),
    ]);

    const createServiceRoleClient = () => {
      const env = loadServerEnv();

      return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    };

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return formatError(res, "Method not allowed", 405);
    }

    const authHeader = (req.headers.authorization as string | undefined) ?? undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return formatError(res, "User authentication required", 401);
    }

    const token = authHeader.replace("Bearer", "").trim();

    let userId: string;
    try {
      const verified = await verifyClerkSessionToken(token);
      userId = verified.userId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid session";
      return formatError(res, message, 401);
    }

    let json: unknown;
    try {
      json = await parseJsonBody(req);
    } catch {
      return formatError(res, "Invalid JSON body", 400);
    }

    const parsedBody = requestSchema.safeParse(json);

    if (!parsedBody.success) {
      return formatError(
        res,
        "Invalid request payload",
        400,
        parsedBody.error.flatten().fieldErrors
      );
    }

    const payload = parsedBody.data;
    let org;

    try {
      org = await loadOrganizationFromRequest(payload.organizationSlug ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Organization lookup failed";
      return formatError(res, message, 404);
    }

    const supabase = createServiceRoleClient();

    if (payload.organizationId && payload.organizationId !== org.id) {
      return formatError(res, "Organization mismatch", 403);
    }

    const { data: actingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("organization_id", org.id)
      .maybeSingle();

    await requireRole({
      userId: actingProfile?.id ?? userId,
      orgId: org.id,
      requiredRoles: ["admin"],
      supabase,
    });

    const redirectBase = payload.redirectBase ?? buildTenantUrl(org.subdomain);
    const redirectUrl = `${redirectBase}/sign-in`;

    let createdUserId: string | null = null;
    let invitationId: string | null = null;

    try {
      const createdUser = await clerkClient.users.createUser({
        emailAddress: [payload.email],
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumbers: payload.phone ? [{ phoneNumber: payload.phone }] : undefined,
      });

      createdUserId = createdUser.id;

      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: payload.email,
        redirectUrl,
      });

      invitationId = invitation.id;

      const { data: profile, error: profileError } = await tenantTable(
        supabase,
        org.id,
        "profiles"
      )
        .insert({
          id: createdUser.id,
          clerk_user_id: createdUser.id,
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone: payload.phone ?? null,
          organization_id: org.id,
          is_active: true,
          status: "invited",
          status_effective_date: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      const { error: roleError } = await tenantTable(supabase, org.id, "user_roles").insert({
        user_id: profile?.id ?? createdUser.id,
        clerk_user_id: createdUser.id,
        organization_id: org.id,
        role: payload.role,
      });

      if (roleError) {
        throw new Error(`Failed to assign role: ${roleError.message}`);
      }

      await tenantTable(supabase, org.id, "user_invitations").insert({
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone: payload.phone ?? null,
        role: payload.role,
        status: "pending",
        invitation_token: invitation.id,
        invitation_type: "clerk_invitation",
        invited_by: userId,
        clerk_user_id: createdUser.id,
        organization_id: org.id,
        sent_at: new Date().toISOString(),
        metadata: {
          redirect_url: redirectUrl,
          organization_id: org.id,
          organization_slug: org.subdomain,
          source: "app_route",
          app_root: getAppRootUrl(),
        },
      });

      return sendJson(res, 200, {
        success: true,
        data: {
          userId: createdUser.id,
          profileId: profile?.id ?? createdUser.id,
          invitationId,
          redirectUrl,
          organizationId: org.id,
          email: payload.email,
          role: payload.role,
        },
      });
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return formatError(res, error.message, error.status);
      }

      const message = error instanceof Error ? error.message : "Failed to invite user";

      // Best-effort cleanup
      if (createdUserId) {
        try {
          const { clerkClient } = await import("../../src/lib/server/clerkClient");
          await clerkClient.users.deleteUser(createdUserId);
        } catch (cleanupError) {
          console.error("Failed to clean up Clerk user", cleanupError);
        }
      }

      if (invitationId) {
        try {
          const { clerkClient } = await import("../../src/lib/server/clerkClient");
          await clerkClient.invitations.revokeInvitation(invitationId);
        } catch (cleanupError) {
          console.error("Failed to clean up Clerk invitation", cleanupError);
        }
      }

      return formatError(res, message, 500);
    }
  } catch (error) {
    console.error("[invite] UNCAUGHT handler error:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return formatError(res, message, 500);
  }
}
