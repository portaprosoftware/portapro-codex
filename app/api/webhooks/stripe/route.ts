import crypto from "crypto";
import { NextResponse } from "next/server";
import { loadServerEnv } from "@/lib/config/env";
import { createStructuredLogger, getRequestContext, logUnhandledError } from "@/lib/observability/logger";

const SIGNATURE_TOLERANCE_SECONDS = 300;

type StripeSignature = {
  timestamp?: number;
  signatures: string[];
};

const parseStripeSignatureHeader = (signatureHeader: string): StripeSignature => {
  const components = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

  const timestamp = components.t ? Number(components.t) : undefined;
  const signatures = components.v1 ? [components.v1] : [];

  return { timestamp, signatures };
};

const safeCompare = (a: string, b: string) => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const verifyStripeSignature = (rawBody: string, signatureHeader: string, secret: string) => {
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  return signatures.some((signature) => safeCompare(signature, expectedSignature));
};

export async function POST(request: Request) {
  const context = getRequestContext("/api/webhooks/stripe");
  const logger = createStructuredLogger(context);

  try {
    const serverEnv = loadServerEnv();
    const signingSecret = serverEnv.STRIPE_WEBHOOK_SECRET;

    if (!signingSecret) {
      logger.error("Stripe webhook secret is not configured");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get("stripe-signature");

    if (!signatureHeader) {
      logger.warn("Missing Stripe signature header");
      return NextResponse.json({ error: "Signature required" }, { status: 401 });
    }

    const isVerified = verifyStripeSignature(rawBody, signatureHeader, signingSecret);

    if (!isVerified) {
      logger.warn("Stripe signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    logger.info("Stripe webhook received", { eventType: payload.type, eventId: payload.id });

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
