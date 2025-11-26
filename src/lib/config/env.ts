import { getHostnameSafe } from './getHostnameSafe';

type ServerEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CLERK_WEBHOOK_SECRET: string;
  VITE_ROOT_DOMAIN: string;
  VITE_MARKETING_URL: string;
  NEXT_PUBLIC_APP_ROOT_URL: string;
};

const fromEnv = (k: string) => (import.meta as any).env?.[k] as string | undefined;

const readValue = (key: string, aliases: string[] = []): string => {
  for (const candidate of [key, ...aliases]) {
    const fromProcess = typeof process !== 'undefined' ? process.env?.[candidate] : undefined;
    if (fromProcess) return fromProcess;

    const fromMeta = fromEnv(candidate);
    if (fromMeta) return fromMeta;
  }

  return '';
};

const normalizeRootDomain = (value: string): string => {
  if (!value) return '';

  const withoutProtocol = value.replace(/^https?:\/\//i, '');
  const withoutPath = withoutProtocol.split('/')[0] ?? '';
  return withoutPath.replace(/^\.+/, '').trim();
};

const inferRootDomainFromHostname = (hostname: string): string => {
  const normalizedHost = normalizeRootDomain(hostname.toLowerCase());
  if (!normalizedHost) return '';

  if (normalizedHost.includes('localhost')) {
    return 'localhost';
  }

  const parts = normalizedHost.split('.').filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }

  return parts[0] ?? '';
};

let cachedRootDomain: string | null = null;

export function getRootDomain(): string {
  if (cachedRootDomain) return cachedRootDomain;

  const envRootDomain = normalizeRootDomain(readValue('VITE_ROOT_DOMAIN', ['NEXT_PUBLIC_ROOT_DOMAIN']));
  const inferredRoot = inferRootDomainFromHostname(getHostnameSafe());
  const resolved = envRootDomain || inferredRoot || 'portaprosoftware.com';

  cachedRootDomain = resolved;
  return resolved;
}

let cachedMarketingUrl: string | null = null;

export function getMarketingUrl(): string {
  if (cachedMarketingUrl) return cachedMarketingUrl;

  const envMarketingUrl = readValue('VITE_MARKETING_URL', ['NEXT_PUBLIC_MARKETING_URL']).trim();
  const resolved = envMarketingUrl || `https://${getRootDomain()}`;

  cachedMarketingUrl = resolved;
  return resolved;
}

let cachedAppRootUrl: string | null = null;

export function getAppRootUrl(): string {
  if (cachedAppRootUrl) return cachedAppRootUrl;

  const appUrl = readValue('NEXT_PUBLIC_APP_ROOT_URL', ['VITE_APP_URL', 'VITE_APP_ROOT_URL']).trim();
  const resolved = appUrl || `https://${getRootDomain()}`;

  cachedAppRootUrl = resolved;
  return resolved;
}

let serverEnvCache: ServerEnv | null = null;

export const loadServerEnv = (): ServerEnv => {
  if (typeof window !== 'undefined') {
    throw new Error('loadServerEnv should only be called on the server');
  }

  if (serverEnvCache) {
    return serverEnvCache;
  }

  serverEnvCache = {
    SUPABASE_URL: readValue('SUPABASE_URL', ['VITE_SUPABASE_URL']),
    SUPABASE_ANON_KEY: readValue('SUPABASE_ANON_KEY', ['VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY']),
    SUPABASE_SERVICE_ROLE_KEY: readValue('SUPABASE_SERVICE_ROLE_KEY'),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: readValue('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', ['VITE_CLERK_PUBLISHABLE_KEY']),
    CLERK_SECRET_KEY: readValue('CLERK_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: readValue('STRIPE_WEBHOOK_SECRET'),
    CLERK_WEBHOOK_SECRET: readValue('CLERK_WEBHOOK_SECRET'),
    VITE_ROOT_DOMAIN: getRootDomain(),
    VITE_MARKETING_URL: getMarketingUrl(),
    NEXT_PUBLIC_APP_ROOT_URL: getAppRootUrl(),
  };

  return serverEnvCache;
};
