import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types.js";
import { loadServerEnv } from "@/lib/config/env.js";
import { buildAuditContext } from "./context.js";
import type { AuditActionPayload } from "./types.js";

const getAuditClient = (client?: SupabaseClient<Database>) => {
  if (client) return client;
  const env = loadServerEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const logAction = async (payload: AuditActionPayload) => {
  const client = getAuditClient(payload.supabase);
  const context = buildAuditContext(payload);

  if (!context.orgId) {
    throw new Error("orgId is required for audit logging");
  }

  const record = {
    org_id: context.orgId,
    user_id: context.userId ?? null,
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId ?? null,
    metadata: payload.metadata ?? {},
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
  };

  await client.from("audit_logs" as any).insert(record);
  return record;
};

export const getTenantAuditLogs = (orgId: string, client?: SupabaseClient<Database>) => {
  const supabase = getAuditClient(client);
  return supabase.from("audit_logs" as any).select("*").eq("org_id", orgId);
};
