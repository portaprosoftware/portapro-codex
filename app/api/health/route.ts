import { NextResponse } from "next/server";
import { createStructuredLogger, getRequestContext, logUnhandledError } from "@/lib/observability/logger";

const apiVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version ?? "unknown";

export async function GET() {
  const context = getRequestContext("/api/health");
  const logger = createStructuredLogger(context);

  try {
    const body = { ok: true, version: apiVersion, time: new Date().toISOString() };

    logger.info("Health check", body);

    const response = NextResponse.json(body, { status: 200 });
    if (context.requestId) {
      response.headers.set("x-request-id", context.requestId);
    }

    return response;
  } catch (error) {
    logUnhandledError(logger, error);
    return NextResponse.json(
      { ok: false, error: "Health check failed", requestId: context.requestId },
      { status: 503 }
    );
  }
}
