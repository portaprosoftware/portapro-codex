/**
 * Client-side environment variables validation
 * All client variables MUST use VITE_ prefix to be exposed to the browser
 */

const required = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

type RequiredEnvVar = typeof required[number];

// Validate and export environment variables
const validateEnv = (): Record<RequiredEnvVar, string> => {
  const missing: string[] = [];
  const envVars: Partial<Record<RequiredEnvVar, string>> = {};

  for (const key of required) {
    const value = import.meta.env[key];
    if (!value) {
      missing.push(key);
    } else {
      envVars[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required client environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all VITE_* variables are set.'
    );
  }

  return envVars as Record<RequiredEnvVar, string>;
};

export const env = {
  ...validateEnv(),
  // Optional variables with smart defaults
  APP_URL: import.meta.env.VITE_APP_URL || 'https://app.portaprosoftware.com',
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || '',
  POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY || '',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  ALLOWED_CLERK_ORG_SLUGS: import.meta.env.VITE_ALLOWED_CLERK_ORG_SLUGS || '',
  // Environment mode helpers
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

// Convenience exports for backward compatibility
export const SUPABASE_URL = env.VITE_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const CLERK_PUBLISHABLE_KEY = env.VITE_CLERK_PUBLISHABLE_KEY;
export const APP_URL = env.APP_URL;

// Mapbox token helper
export const getMapboxToken = (): string => {
  const token = env.MAPBOX_TOKEN;
  if (!token) {
    console.warn('VITE_MAPBOX_TOKEN not set - map features may be limited');
  }
  return token;
};
