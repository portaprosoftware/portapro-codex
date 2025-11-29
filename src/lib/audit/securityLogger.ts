import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types.js";
import { loadServerEnv } from "@/lib/config/env.js";
import type { SecurityEventPayload } from "./types.js";

const getAuditClient = (client?: SupabaseClient<Database>) => {
  if (client) return client;
  const env = loadServerEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const logSecurityEvent = async (payload: SecurityEventPayload) => {
  const client = getAuditClient(payload.supabase);
  const record = {
    org_id: payload.orgId ?? null,
    type: payload.type,
    source: payload.source ?? null,
    metadata: payload.metadata ?? {},
  };

  await client.from("security_events" as any).insert(record);
  return record;
};
