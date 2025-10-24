/**
 * Server-side environment variables (NOT exposed to browser)
 * Only use in Vercel serverless/edge functions
 * DO NOT import this file in client code!
 */

const requiredServerEnv = [
  'CLERK_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const optionalServerEnv = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'OPENAI_API_KEY',
] as const;

type RequiredServerEnv = (typeof requiredServerEnv)[number];
type OptionalServerEnv = (typeof optionalServerEnv)[number];

// Validate required environment variables
const missing = requiredServerEnv.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `❌ Missing required server environment variables: ${missing.join(', ')}\n` +
    `Set these in your Vercel project settings (server-only, no VITE_ prefix).`
  );
}

export const envServer = {
  // Required
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  
  // Optional
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
} as const;
