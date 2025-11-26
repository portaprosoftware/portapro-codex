import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractOrgSlug } from "./lib/getOrgFromHost";

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

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const orgSlug = extractOrgSlug(host);

  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-slug", orgSlug ?? "");
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-request-id", requestId);

  applySecurityHeaders(response);

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

  if (isApiRoute && allowedOrigin) {
    applyCorsHeaders(response, allowedOrigin);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
