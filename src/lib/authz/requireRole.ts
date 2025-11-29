import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types.js";
import { loadServerEnv } from "@/lib/config/env.js";

export const INTERNAL_ROLES = ["admin", "dispatcher", "driver", "customer"] as const;
export type InternalRole = (typeof INTERNAL_ROLES)[number];

const LEGACY_ROLE_PREFIX = "org:";
const INTERNAL_ROLE_SET = new Set<string>(INTERNAL_ROLES);
const ROLE_MAPPINGS: Record<string, InternalRole> = {
  "org:owner": "admin",
  "org:admin": "admin",
  owner: "admin",
  admin: "admin",
  "org:dispatcher": "dispatcher",
  dispatch: "dispatcher",
  dispatcher: "dispatcher",
  "org:driver": "driver",
  driver: "driver",
  viewer: "customer",
  customer: "customer",
  "org:viewer": "customer",
};

export class AuthorizationError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN";
  status: number;

  constructor(message: string, code: AuthorizationError["code"] = "FORBIDDEN") {
    super(message);
    this.code = code;
    this.status = code === "UNAUTHORIZED" ? 401 : 403;
  }
}

export type RequireRoleInput = {
  userId?: string | null;
  orgId?: string | null;
  requiredRoles: Array<InternalRole | string>;
  supabase?: SupabaseClient<Database>;
};

type ProfileRoleRow = {
  organization_id?: string | null;
  user_roles?: { role: string | null } | { role: string | null }[] | null;
};

const createServiceRoleClient = () => {
  const env = loadServerEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const extractRoleFromProfile = (row: ProfileRoleRow | null): string | null => {
  if (!row?.user_roles) return null;

  if (Array.isArray(row.user_roles)) {
    return row.user_roles[0]?.role ?? null;
  }

  return (row.user_roles as { role: string | null }).role ?? null;
};

const normalizeRole = (role?: string | null): InternalRole | null => {
  const trimmed = role?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(LEGACY_ROLE_PREFIX)) {
    return null;
  }

  return INTERNAL_ROLE_SET.has(trimmed) ? (trimmed as InternalRole) : null;
};

const normalizeRequiredRoles = (roles: Array<InternalRole | string>): InternalRole[] => {
  const normalized = (roles || [])
    .map((role) => {
      const trimmed = role?.toString().trim();
      if (!trimmed) return null;

      if (ROLE_MAPPINGS[trimmed]) return ROLE_MAPPINGS[trimmed];
      if (INTERNAL_ROLE_SET.has(trimmed)) return trimmed as InternalRole;
      if (trimmed.startsWith(LEGACY_ROLE_PREFIX)) {
        throw new AuthorizationError("Legacy roles are not supported");
      }

      return null;
    })
    .filter(Boolean) as InternalRole[];

  if (roles.length > 0 && normalized.length === 0) {
    throw new AuthorizationError("Unsupported role requirement");
  }

  return normalized;
};

export const getUserRole = async (
  supabase: SupabaseClient<Database>,
  userId?: string | null,
  orgId?: string | null
): Promise<InternalRole | null> => {
  if (!userId || !orgId) return null;

  const selectProfile = () =>
    supabase
      .from("profiles")
      .select("id, organization_id, user_roles(role)")
      .eq("organization_id", orgId);

  const [byProfileId, byClerkId] = await Promise.all([
    selectProfile().eq("id", userId).maybeSingle(),
    selectProfile().eq("clerk_user_id", userId).maybeSingle(),
  ]);

  const profileResult = byProfileId.data ? byProfileId : byClerkId;

  if (byProfileId.error && byClerkId.error) {
    throw new AuthorizationError("Unable to verify permissions");
  }

  if (!profileResult.data) {
    return null;
  }

  const rawRole = extractRoleFromProfile(profileResult.data);
  const normalizedRole = normalizeRole(rawRole);

  if (rawRole && !normalizedRole) {
    throw new AuthorizationError("Legacy roles are not supported");
  }

  return normalizedRole;
};

export const requireRole = async ({ userId, orgId, requiredRoles, supabase }: RequireRoleInput) => {
  if (!userId) {
    throw new AuthorizationError("User authentication required", "UNAUTHORIZED");
  }

  const normalizedOrgId = orgId?.trim();
  if (!normalizedOrgId) {
    throw new AuthorizationError("Organization ID required", "UNAUTHORIZED");
  }

  const rolesToCheck = normalizeRequiredRoles(requiredRoles || []);

  if (rolesToCheck.length === 0) {
    return;
  }

  const client = supabase ?? createServiceRoleClient();
  const userRole = await getUserRole(client, userId, normalizedOrgId);

  if (!userRole) {
    throw new AuthorizationError("User is not a member of this organization");
  }

  const hasRole = rolesToCheck.some((role) => role === userRole);
  if (!hasRole) {
    throw new AuthorizationError("Insufficient role for this action");
  }
};
