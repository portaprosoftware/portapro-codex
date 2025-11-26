import { z } from 'zod';

const readEnvValue = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  // Vite/browser runtime fallback
  if (typeof import.meta !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaEnv = (import.meta as any).env as Record<string, string | undefined> | undefined;

    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  }

  return undefined;
};

const resolveEnvValue = (key: string, aliases: string[] = []) => {
  for (const candidate of [key, ...aliases]) {
    const value = readEnvValue(candidate);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

const clientEnvSchema = z.object({
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
  SUPABASE_ANON_KEY: z.string().min(1, { message: 'SUPABASE_ANON_KEY is required' }),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required' }),
  VITE_ROOT_DOMAIN: z
    .string()
    .min(1, { message: 'VITE_ROOT_DOMAIN is required' })
    .regex(/^[a-z0-9.-]+$/i, { message: 'VITE_ROOT_DOMAIN should be a bare domain (no protocol)' }),
  VITE_MARKETING_URL: z.string().url({ message: 'VITE_MARKETING_URL must be a valid URL' }),
  NEXT_PUBLIC_APP_ROOT_URL: z.string().url({ message: 'NEXT_PUBLIC_APP_ROOT_URL must be a valid URL' }),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required (server-only)' }),
  CLERK_SECRET_KEY: z.string().min(1, { message: 'CLERK_SECRET_KEY is required (server-only)' }),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
});

type ClientEnv = z.infer<typeof clientEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;

type EnvKeyAliases<T extends Record<string, unknown>> = {
  [K in keyof T]: string[];
};

const clientEnvAliases: EnvKeyAliases<ClientEnv> = {
  SUPABASE_URL: ['VITE_SUPABASE_URL'],
  SUPABASE_ANON_KEY: ['VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY'],
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ['VITE_CLERK_PUBLISHABLE_KEY'],
  VITE_ROOT_DOMAIN: ['NEXT_PUBLIC_ROOT_DOMAIN'],
  VITE_MARKETING_URL: ['NEXT_PUBLIC_MARKETING_URL'],
  NEXT_PUBLIC_APP_ROOT_URL: ['VITE_APP_URL', 'VITE_APP_ROOT_URL'],
};

const serverEnvAliases: EnvKeyAliases<ServerEnv> = {
  ...clientEnvAliases,
  SUPABASE_SERVICE_ROLE_KEY: [],
  CLERK_SECRET_KEY: [],
  STRIPE_WEBHOOK_SECRET: [],
  CLERK_WEBHOOK_SECRET: [],
};

const formatZodErrors = (error: z.ZodError) => {
  const fields = error.flatten().fieldErrors;
  return Object.entries(fields)
    .map(([key, messages]) => `${key}: ${(messages || []).join(', ')}`)
    .join('\n');
};

const buildRawEnv = <T extends Record<string, unknown>>(aliases: EnvKeyAliases<T>) =>
  Object.fromEntries(
    Object.entries(aliases).map(([key, fallbackKeys]) => [key, resolveEnvValue(key, fallbackKeys)])
  ) as Partial<T>;

const inferRootDomainFromHostname = (hostname?: string): string | undefined => {
  if (!hostname) return undefined;

  const normalized = hostname.toLowerCase();

  if (normalized === 'portaprosoftware.com' || normalized.endsWith('.portaprosoftware.com')) {
    return 'portaprosoftware.com';
  }

  if (normalized.includes('localhost')) {
    return 'localhost';
  }

  const parts = normalized.split('.').filter(Boolean);

  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }

  return parts[0];
};

const inferRootDomain = (marketingUrl?: string): string | undefined => {
  if (marketingUrl) {
    try {
      const inferredFromMarketing = inferRootDomainFromHostname(new URL(marketingUrl).hostname);
      if (inferredFromMarketing) {
        return inferredFromMarketing;
      }
    } catch {
      // ignore invalid marketing URL, validation will handle it later
    }
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return inferRootDomainFromHostname(window.location.hostname);
  }

  return undefined;
};

const parseEnv = <T extends z.ZodTypeAny>(
  schema: T,
  aliases: EnvKeyAliases<z.infer<T>>,
  label: 'Client' | 'Server'
): z.infer<T> => {
  const rawEnv = buildRawEnv<z.infer<T>>(aliases);

  const result = schema.safeParse(rawEnv);

  if (!result.success) {
    throw new Error(
      `❌ ${label} environment validation failed. Please set the following variables:\n${formatZodErrors(result.error)}`
    );
  }

  return result.data;
};

const parseClientEnv = (): ClientEnv => {
  const rawEnv = buildRawEnv<ClientEnv>(clientEnvAliases);

  const marketingUrl = rawEnv.VITE_MARKETING_URL;
  const rootDomain = rawEnv.VITE_ROOT_DOMAIN ?? inferRootDomain(marketingUrl);
  const resolvedMarketingUrl = marketingUrl ?? (rootDomain ? `https://${rootDomain}` : undefined);

  const result = clientEnvSchema.safeParse({
    ...rawEnv,
    VITE_ROOT_DOMAIN: rootDomain,
    VITE_MARKETING_URL: resolvedMarketingUrl,
  });

  if (!result.success) {
    const shouldFailHard = !rootDomain && !resolvedMarketingUrl;

    if (shouldFailHard) {
      throw new Error(
        `❌ Client environment validation failed. Please set the following variables:\n${formatZodErrors(result.error)}`
      );
    }

    throw new Error(
      `❌ Client environment validation failed. Please set the following variables:\n${formatZodErrors(result.error)}`
    );
  }

  return result.data;
};

export const clientEnv = parseClientEnv();

let serverEnvCache: ServerEnv | null = null;

export const loadServerEnv = (): ServerEnv => {
  if (typeof window !== 'undefined') {
    throw new Error('loadServerEnv should only be called on the server');
  }

  if (!serverEnvCache) {
    serverEnvCache = parseEnv(serverEnvSchema, serverEnvAliases, 'Server');
  }

  return serverEnvCache;
};
