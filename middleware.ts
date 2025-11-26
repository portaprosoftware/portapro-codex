import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractOrgSlug } from "./lib/getOrgFromHost";
import type { Database } from "./integrations/supabase/types";
import { verifyClerkSessionToken } from "./lib/server/clerkClient";
import { loadServerEnv } from "./lib/config/env";
import { getUserRole } from "./lib/authz/requireRole";

const isProduction = process.env.NODE_ENV === "production";

const PORTAPRO_HOSTNAME = "portaprosoftware.com";

const isAllowedCorsOrigin = (origin: string | null): origin is string => {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const isProductionOrigin =
      url.protocol === "https:" &&
      (url.hostname === PORTAPRO_HOSTNAME || url.hostname.endsWith(`.${PORTAPRO_HOSTNAME}`));

    const isLocalDevOrigin = url.hostname === "localhost" && url.protocol === "http:";

    return isProduction ? isProductionOrigin : isProductionOrigin || isLocalDevOrigin;
  } catch (error) {
    console.warn("Invalid origin header", { origin, error });
    return false;
  }
};

const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
  );

  if (isProduction) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
};

const applyCorsHeaders = (response: NextResponse, origin: string) => {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-Org-Slug, X-Request-ID"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
};

const createServiceRoleClient = () => {
  const env = loadServerEnv();

  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const getAuthToken = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer", "").trim();
  }

  const sessionCookie = request.cookies.get("__session")?.value;
  return sessionCookie ?? null;
};

const loadUserContext = async (request: NextRequest, supabase: ReturnType<typeof createServiceRoleClient>) => {
  const token = getAuthToken(request);

  if (!token) return null;

  try {
    const verified = await verifyClerkSessionToken(token);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("clerk_user_id", verified.userId)
      .maybeSingle();

    if (error) {
      console.warn("middleware: unable to load profile", error);
      return null;
    }

    if (!profile) return null;

    const role = await getUserRole(supabase, profile.id, profile.organization_id);

    return {
      clerkUserId: verified.userId,
      profileId: profile.id,
      organizationId: profile.organization_id,
      role,
    } as const;
  } catch (error) {
    console.warn("middleware: unable to resolve user context", error);
    return null;
  }
};

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const orgSlug = extractOrgSlug(host);

  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-slug", orgSlug ?? "");
  requestHeaders.set("x-request-id", requestId);

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const origin = request.headers.get("origin");
  const originAllowed = isAllowedCorsOrigin(origin);
  const allowedOrigin = originAllowed ? origin : null;

  if (isApiRoute && request.method === "OPTIONS") {
    if (!originAllowed) {
      return new NextResponse("CORS origin not allowed", { status: 403 });
    }

    const preflight = new NextResponse(null, { status: 204 });
    applySecurityHeaders(preflight);
    applyCorsHeaders(preflight, allowedOrigin!);
    preflight.headers.set("x-request-id", requestId);
    return preflight;
  }

  const supabase = createServiceRoleClient();
  const userContext = await loadUserContext(request, supabase);

  if (userContext?.profileId) {
    requestHeaders.set("x-user-id", userContext.profileId);
  }

  if (userContext?.organizationId) {
    requestHeaders.set("x-org-id", userContext.organizationId);
  }

  if (userContext?.role) {
    requestHeaders.set("x-user-role", userContext.role);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-request-id", requestId);

  if (userContext?.organizationId) {
    response.headers.set("x-org-id", userContext.organizationId);
  }

  if (userContext?.role) {
    response.headers.set("x-user-role", userContext.role);
  }

  applySecurityHeaders(response);

  if (isApiRoute && allowedOrigin) {
    applyCorsHeaders(response, allowedOrigin);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
