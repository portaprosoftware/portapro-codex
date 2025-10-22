import { NextRequest, NextResponse } from "next/server";
import { resolveOrigin } from "@/lib/origin";

export function middleware(req: NextRequest) {
  // Compute the runtime origin from env or headers
  const runtimeOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN
    || `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;

  // Make these available to your app (optional)
  const res = NextResponse.next({
    request: { headers: req.headers },
  });
  res.headers.set("x-app-origin", runtimeOrigin);

  return res;
}

// Optional: match only app routes if you want to skip static assets
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
