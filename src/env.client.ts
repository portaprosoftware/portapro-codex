import { clientEnv } from '@/lib/config/env';

const optionalEnv = {
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || '',
  POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY || '',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  ALLOWED_CLERK_ORG_SLUGS: import.meta.env.VITE_ALLOWED_CLERK_ORG_SLUGS || '',
  VITE_ENABLE_SERVICE_WORKER: import.meta.env.VITE_ENABLE_SERVICE_WORKER || 'false',
  // Environment mode helpers
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

export const env = {
  ...clientEnv,
  ...optionalEnv,
  APP_URL: clientEnv.NEXT_PUBLIC_APP_ROOT_URL,
};

export const SUPABASE_URL = env.SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = env.SUPABASE_ANON_KEY;
export const CLERK_PUBLISHABLE_KEY = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const APP_URL = env.APP_URL;

// Mapbox token helper
export const getMapboxToken = (): string => {
  const token = env.MAPBOX_TOKEN;
  if (!token) {
    console.warn('VITE_MAPBOX_TOKEN not set - map features may be limited');
  }
  return token;
};
