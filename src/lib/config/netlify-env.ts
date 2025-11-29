export function loadServerEnv() {
  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    CLERK_SECRET_KEY,
    APP_URL,
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variables");
  }

  return {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    CLERK_SECRET_KEY,
    APP_URL: APP_URL || "https://app.portaprosoftware.com",
  };
}
