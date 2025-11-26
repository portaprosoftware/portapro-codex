import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractOrgSlug } from "./lib/getOrgFromHost";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const orgSlug = extractOrgSlug(host);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-slug", orgSlug ?? "");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
