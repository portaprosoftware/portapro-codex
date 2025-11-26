import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuditRequestLike = {
  headers?: {
    get(key: string): string | null;
  };
};

export type AuditActionPayload = {
  orgId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request | AuditRequestLike | null;
  supabase?: SupabaseClient<Database>;
};

export type SecurityEventPayload = {
  orgId?: string | null;
  type: string;
  source?: string;
  metadata?: Record<string, unknown>;
  supabase?: SupabaseClient<Database>;
};

export type AuditContext = {
  orgId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};
