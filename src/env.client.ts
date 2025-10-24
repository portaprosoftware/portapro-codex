/**
 * Client-side environment variables (browser-safe, VITE_ prefixed)
 * Throws at runtime if required keys are missing.
 */

const requiredClientEnv = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

const optionalClientEnv = [
  'VITE_MAPBOX_TOKEN',
  'VITE_APP_URL',
  'VITE_POSTHOG_KEY',
  'VITE_SENTRY_DSN',
  'VITE_GA_MEASUREMENT_ID',
] as const;

type RequiredClientEnv = (typeof requiredClientEnv)[number];
type OptionalClientEnv = (typeof optionalClientEnv)[number];

// Validate required environment variables
const missing = requiredClientEnv.filter(key => !import.meta.env[key]);
if (missing.length > 0) {
  throw new Error(
    `❌ Missing required client environment variables: ${missing.join(', ')}\n` +
    `Set these in your Vercel project settings or local .env file.`
  );
}

// Export typed environment object
export const env = {
  // Required
  CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  
  // Optional
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN as string | undefined,
  APP_URL: import.meta.env.VITE_APP_URL as string | undefined,
  POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY as string | undefined,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined,
  
  // Special flags
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

// Helper to get Mapbox token with fallback to edge function
export async function getMapboxToken(): Promise<string> {
  if (env.MAPBOX_TOKEN) {
    return env.MAPBOX_TOKEN;
  }
  
  // Fallback: fetch from edge function
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/functions/v1/get-mapbox-token`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Mapbox token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Failed to get Mapbox token:', error);
    throw new Error('Mapbox token not configured. Set VITE_MAPBOX_TOKEN or configure edge function.');
  }
}
