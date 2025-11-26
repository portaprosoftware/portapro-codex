import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loadServerEnv } from "@/lib/config/env";
import type { Database } from "@/integrations/supabase/types";
import { createStructuredLogger, getRequestContext, logUnhandledError } from "@/lib/observability/logger";

export async function GET() {
  const context = getRequestContext("/api/ready");
  const logger = createStructuredLogger(context);

  try {
    const serverEnv = loadServerEnv();
    const supabase = createClient<Database>(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: connectivityError } = await supabase.from("organizations").select("id").limit(1);

    if (connectivityError) {
      logger.warn("Supabase connectivity failed", { error: connectivityError.message });
      return NextResponse.json(
        { ok: false, error: "Supabase unreachable", requestId: context.requestId },
        { status: 503 }
      );
    }

    if (!serverEnv.CLERK_SECRET_KEY) {
      logger.warn("Auth configuration missing");
      return NextResponse.json(
        { ok: false, error: "Auth layer unavailable", requestId: context.requestId },
        { status: 503 }
      );
    }

    const payload = { ok: true, time: new Date().toISOString(), requestId: context.requestId };
    logger.info("Readiness check passed", payload);

    const response = NextResponse.json(payload, { status: 200 });
    if (context.requestId) {
      response.headers.set("x-request-id", context.requestId);
    }

    return response;
  } catch (error) {
    logUnhandledError(logger, error);
    return NextResponse.json(
      { ok: false, error: "Internal readiness error", requestId: context.requestId },
      { status: 503 }
    );
  }
}
