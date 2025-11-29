import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types.js";
import { tenantTable, requireOrgId } from "@/lib/db/tenant.js";
import { loadServerEnv } from "@/lib/config/env.js";

const BOM = "\ufeff";

export type ExportOptions = {
  orgId: string | null | undefined;
  supabase?: SupabaseClient<Database>;
};

const ensureClient = (client?: SupabaseClient<Database>) => {
  if (client) return client;
  const env = loadServerEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const escapeCell = (value: unknown) => {
  const str = value === undefined || value === null ? "" : String(value);
  const needsQuote = str.includes(",") || str.includes("\n") || str.includes('"');
  const safeValue = ["=", "+", "-", "@"].some((prefix) => str.startsWith(prefix))
    ? `'${str}`
    : str;
  if (!needsQuote) return safeValue;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

export const serializeToCsv = (rows: Record<string, any>[], fields: string[]) => {
  const header = fields.join(",");
  const lines = rows.map((row) => fields.map((field) => escapeCell(row[field])).join(","));
  return `${BOM}${header}\n${lines.join("\n")}`;
};

export const exportTenantRows = async (
  table: keyof Database["public"]["Tables"],
  fields: string[],
  options: ExportOptions
) => {
  const orgId = requireOrgId(options.orgId);
  const client = ensureClient(options.supabase);

  const { data, error } = await tenantTable(client, orgId, table as string)
    .select(fields.join(","))
    .order("created_at", { ascending: true } as any);

  if (error) {
    throw new Error(`Failed to export ${table}: ${error.message}`);
  }

  return serializeToCsv(data ?? [], fields);
};
