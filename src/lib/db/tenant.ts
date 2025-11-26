import { SupabaseClient } from "@supabase/supabase-js";

type InsertPayload = Record<string, any> | Record<string, any>[];

export function requireOrgId(orgId?: string | null): string {
  const trimmed = orgId?.trim();

  if (!trimmed) {
    throw new Error("Organization ID required");
  }

  return trimmed;
}

export function tenantTable(
  client: SupabaseClient,
  orgId: string | null | undefined,
  table: string
) {
  const tenantId = requireOrgId(orgId);
  const baseTable = client.from(table as any);

  const withOrganizationId = (payload: InsertPayload) => {
    const records = Array.isArray(payload) ? payload : [payload];
    const sanitized = records.map(record => {
      const { organization_id: _ignored, ...rest } = record as Record<string, any>;
      return { ...rest, organization_id: tenantId };
    });

    return Array.isArray(payload) ? sanitized : sanitized[0];
  };

  return Object.assign(baseTable, {
    insert(payload: InsertPayload) {
      return baseTable.insert(withOrganizationId(payload));
    },
  });
}
