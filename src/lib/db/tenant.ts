import { SupabaseClient } from "@supabase/supabase-js";
import { resolveOrgId } from "../orgContext";

type InsertPayload = Record<string, any> | Record<string, any>[];

export function requireOrgId(orgId?: string | null): string {
  const resolvedOrgId = resolveOrgId(orgId);
  const trimmed = resolvedOrgId?.toString().trim();
  if (!trimmed) {
    throw new Error("Organization ID required");
  }
  return trimmed;
}

export function tenantTable(
  client: SupabaseClient,
  orgId: string | null | undefined,
  tableName: string
) {
  const tenantId = requireOrgId(orgId);
  const table = client.from(tableName as any);

  // Ensures organization_id is always injected server-side
  const withOrgId = (payload: InsertPayload) => {
    const records = Array.isArray(payload) ? payload : [payload];

    const sanitized = records.map((record) => {
      const { organization_id: _ignored, ...rest } = record;
      return { ...rest, organization_id: tenantId };
    });

    return Array.isArray(payload) ? sanitized : sanitized[0];
  };

  return {
    select: (...args: any[]) => table.select(...args).eq("organization_id", tenantId),

    insert: (values: InsertPayload, options?: any) =>
      table.insert(withOrgId(values), options),

    update: (values: any) =>
      table.update(values).eq("organization_id", tenantId),

    delete: () =>
      table.delete().eq("organization_id", tenantId),
  };
}
