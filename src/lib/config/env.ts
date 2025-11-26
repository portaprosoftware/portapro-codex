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
  NEXT_PUBLIC_ROOT_DOMAIN: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_ROOT_DOMAIN is required' })
    .regex(/^[a-z0-9.-]+$/i, { message: 'NEXT_PUBLIC_ROOT_DOMAIN should be a bare domain (no protocol)' }),
  NEXT_PUBLIC_MARKETING_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_MARKETING_URL must be a valid URL' }),
  NEXT_PUBLIC_APP_ROOT_URL: z.string().url({ message: 'NEXT_PUBLIC_APP_ROOT_URL must be a valid URL' }),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required (server-only)' }),
  CLERK_SECRET_KEY: z.string().min(1, { message: 'CLERK_SECRET_KEY is required (server-only)' }),
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
  NEXT_PUBLIC_ROOT_DOMAIN: ['VITE_ROOT_DOMAIN'],
  NEXT_PUBLIC_MARKETING_URL: ['VITE_MARKETING_URL'],
  NEXT_PUBLIC_APP_ROOT_URL: ['VITE_APP_URL', 'VITE_APP_ROOT_URL'],
};

const serverEnvAliases: EnvKeyAliases<ServerEnv> = {
  ...clientEnvAliases,
  SUPABASE_SERVICE_ROLE_KEY: [],
  CLERK_SECRET_KEY: [],
};

const formatZodErrors = (error: z.ZodError) => {
  const fields = error.flatten().fieldErrors;
  return Object.entries(fields)
    .map(([key, messages]) => `${key}: ${(messages || []).join(', ')}`)
    .join('\n');
};

const parseEnv = <T extends z.ZodTypeAny>(
  schema: T,
  aliases: EnvKeyAliases<z.infer<T>>,
  label: 'Client' | 'Server'
): z.infer<T> => {
  const rawEnv = Object.fromEntries(
    Object.entries(aliases).map(([key, fallbackKeys]) => [key, resolveEnvValue(key, fallbackKeys)])
  );

  const result = schema.safeParse(rawEnv);

  if (!result.success) {
    throw new Error(
      `❌ ${label} environment validation failed. Please set the following variables:\n${formatZodErrors(result.error)}`
    );
  }

  return result.data;
};

export const clientEnv = parseEnv(clientEnvSchema, clientEnvAliases, 'Client');

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
