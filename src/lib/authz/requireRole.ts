import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { loadServerEnv } from "@/lib/config/env";

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
  requiredRoles: string[];
  supabase?: SupabaseClient<Database>;
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

export const requireRole = async ({ userId, orgId, requiredRoles, supabase }: RequireRoleInput) => {
  if (!userId) {
    throw new AuthorizationError("User authentication required", "UNAUTHORIZED");
  }

  const normalizedOrgId = orgId?.trim();
  if (!normalizedOrgId) {
    throw new AuthorizationError("Organization ID required", "UNAUTHORIZED");
  }

  const rolesToCheck = requiredRoles?.map((role) => role.trim()).filter(Boolean) || [];
  if (rolesToCheck.length === 0) {
    return;
  }

  const client = supabase ?? createServiceRoleClient();
  const { data, error } = await client
    .from("user_roles")
    .select("role, organization_id")
    .eq("user_id", userId)
    .eq("organization_id", normalizedOrgId)
    .maybeSingle();

  if (error) {
    throw new AuthorizationError("Unable to verify permissions");
  }

  if (!data) {
    throw new AuthorizationError("User is not a member of this organization");
  }

  const hasRole = rolesToCheck.some((role) => role === data.role);
  if (!hasRole) {
    throw new AuthorizationError("Insufficient role for this action");
  }
};
