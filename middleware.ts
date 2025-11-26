import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractOrgSlug } from "./lib/getOrgFromHost";

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
