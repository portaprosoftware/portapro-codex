// Pure Vite environment configuration
// Uses ONLY import.meta.env (no process.env, no Next.js conventions)

const getEnv = (key: string): string => {
  return (import.meta.env[key] as string) || '';
};

// Client environment variables
export const clientEnv = {
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  CLERK_PUBLISHABLE_KEY: getEnv('VITE_CLERK_PUBLISHABLE_KEY'),
  MAPBOX_TOKEN: getEnv('VITE_MAPBOX_TOKEN'),
  APP_URL: getEnv('VITE_APP_URL'),
};

// Supabase helpers
export const getSupabaseUrl = (): string => clientEnv.SUPABASE_URL;
export const getSupabaseAnonKey = (): string => clientEnv.SUPABASE_ANON_KEY;

// Clerk helper
export const getClerkPublishableKey = (): string => clientEnv.CLERK_PUBLISHABLE_KEY;

// Mapbox helper
export const getMapboxToken = (): string => clientEnv.MAPBOX_TOKEN;

// App URL helper
export const getAppUrl = (): string => clientEnv.APP_URL || 'http://localhost:8080';

// Domain helpers for backwards compatibility with domains.ts
export function getAppRootUrl(): string {
  if (clientEnv.APP_URL) {
    return clientEnv.APP_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'https://app.portaprosoftware.com';
}

export function getRootDomain(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  }
  return 'portaprosoftware.com';
}

export function getMarketingUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const domain = parts.slice(-2).join('.');
      return `https://${domain}`;
    }
  }
  return 'https://portaprosoftware.com';
}
