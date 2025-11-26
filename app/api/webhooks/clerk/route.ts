import crypto from "crypto";
import { NextResponse } from "next/server";
import { loadServerEnv } from "@/lib/config/env";
import { createStructuredLogger, getRequestContext, logUnhandledError } from "@/lib/observability/logger";

const SIGNATURE_TOLERANCE_SECONDS = 300;

const decodeClerkSecret = (secret: string) => Buffer.from(secret.replace("whsec_", ""), "base64");

const safeCompare = (a: string, b: string) => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const extractClerkSignatureCandidates = (signatureHeader: string) =>
  signatureHeader
    .split(" ")
    .flatMap((token) => token.split(","))
    .map((token) => token.replace(/^v1[=,]?/, "").trim())
    .filter(Boolean);

const verifyClerkSignature = (rawBody: string, request: Request, secret: string) => {
  const timestampHeader = request.headers.get("svix-timestamp");
  const signatureHeader = request.headers.get("svix-signature");

  if (!timestampHeader || !signatureHeader) {
    return false;
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const candidates = extractClerkSignatureCandidates(signatureHeader);
  if (candidates.length === 0) {
    return false;
  }

  const signedPayload = `${timestampHeader}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", decodeClerkSecret(secret))
    .update(signedPayload)
    .digest("base64");

  return candidates.some((candidate) => safeCompare(candidate, expectedSignature));
};

export async function POST(request: Request) {
  const context = getRequestContext("/api/webhooks/clerk");
  const logger = createStructuredLogger(context);

  try {
    const serverEnv = loadServerEnv();
    const signingSecret = serverEnv.CLERK_WEBHOOK_SECRET;

    if (!signingSecret) {
      logger.error("Clerk webhook secret is not configured");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    const rawBody = await request.text();

    const isVerified = verifyClerkSignature(rawBody, request, signingSecret);

    if (!isVerified) {
      logger.warn("Clerk signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    logger.info("Clerk webhook received", { type: payload.type, id: payload.data?.id });

    const response = NextResponse.json({ received: true, requestId: context.requestId }, { status: 200 });

    if (context.requestId) {
      response.headers.set("x-request-id", context.requestId);
    }

    return response;
  } catch (error) {
    logUnhandledError(logger, error);
    return NextResponse.json({ error: "Webhook handling failed", requestId: context.requestId }, { status: 400 });
  }
}
