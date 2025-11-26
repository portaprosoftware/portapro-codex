import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { loadOrganizationFromRequest } from "@/lib/server/organization-loader";
import { loadServerEnv } from "@/lib/config/env";
import { buildTenantUrl, getAppRootUrl } from "@/lib/config/domains";
import { tenantTable } from "@/lib/db/tenant";
import type { Database } from "@/integrations/supabase/types";
import { AuthorizationError, requireRole } from "@/lib/authz/requireRole";
import { clerkClient, verifyClerkSessionToken } from "@/lib/server/clerkClient";

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["org:owner", "org:admin", "org:dispatcher", "org:driver"]),
  phone: z.string().optional(),
  organizationId: z.string().optional(),
  organizationSlug: z.string().optional(),
  redirectBase: z.string().url().optional(),
});

const createServiceRoleClient = () => {
  const env = loadServerEnv();

  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const formatError = (message: string, status = 400, details?: unknown) =>
  NextResponse.json({ success: false, error: message, details }, { status });

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return formatError("User authentication required", 401);
  }

  const token = authHeader.replace("Bearer", "").trim();

  let userId: string;
  try {
    const verified = await verifyClerkSessionToken(token);
    userId = verified.userId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid session";
    return formatError(message, 401);
  }

  const parsedBody = requestSchema.safeParse(await req.json());

  if (!parsedBody.success) {
    return formatError("Invalid request payload", 400, parsedBody.error.flatten().fieldErrors);
  }

  const payload = parsedBody.data;
  const org = await loadOrganizationFromRequest(payload.organizationSlug ?? null);
  const supabase = createServiceRoleClient();

  if (payload.organizationId && payload.organizationId !== org.id) {
    return formatError("Organization mismatch", 403);
  }

  // TODO: Replace with Supabase role lookup in next phase

  const { data: actingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("organization_id", org.id)
    .maybeSingle();

  await requireRole({
    userId: actingProfile?.id ?? null,
    orgId: org.id,
    requiredRoles: ["org:owner", "org:admin"],
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
      sent_at: new Date().toISOString(),
      metadata: {
        redirect_url: redirectUrl,
        organization_id: org.id,
        organization_slug: org.subdomain,
        source: "app_route",
        app_root: getAppRootUrl(),
      },
    });

    return NextResponse.json({
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
      return formatError(error.message, error.status);
    }

    const message = error instanceof Error ? error.message : "Failed to invite user";

    if (createdUserId) {
      try {
        await clerkClient.users.deleteUser(createdUserId);
      } catch (cleanupError) {
        console.error("Failed to clean up Clerk user", cleanupError);
      }
    }

    if (invitationId) {
      try {
        await clerkClient.invitations.revokeInvitation(invitationId);
      } catch (cleanupError) {
        console.error("Failed to clean up Clerk invitation", cleanupError);
      }
    }

    return formatError(message, 500);
  }
}
