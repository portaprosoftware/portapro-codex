import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { loadServerEnv } from "@/lib/config/env";
import { tenantTable, requireOrgId } from "@/lib/db/tenant";
import { ImportError, ImportFieldError } from "./errors";
import { ImportType, getValidator } from "./validators";

export type ImportRequest<TRecord = Record<string, any>> = {
  type: ImportType;
  orgId: string | null | undefined;
  userId?: string | null;
  rows: TRecord[];
  supabase?: SupabaseClient<Database>;
  useRpcAtomic?: boolean;
};

export type ImportResponse = {
  ok: boolean;
  message: string;
  errors?: ImportFieldError[];
  inserted?: number;
};

const createServiceClient = () => {
  const env = loadServerEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const ensureSupabaseClient = (client?: SupabaseClient<Database>) => client ?? createServiceClient();

const verifyOwnership = async (
  client: SupabaseClient<Database>,
  orgId: string,
  table: string,
  id: string
) => {
  if (!id) return { ok: true };

  const { data, error } = await tenantTable(client, orgId, table)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false };
  }

  return { ok: true };
};

const writeAuditLog = async (
  client: SupabaseClient<Database>,
  payload: {
    orgId: string;
    userId?: string | null;
    type: ImportType;
    total: number;
    success: number;
    errors: ImportFieldError[];
  }
) => {
  await client
    .from("import_audit_log" as any)
    .insert({
      id: randomUUID(),
      org_id: payload.orgId,
      user_id: payload.userId ?? null,
      type: payload.type,
      total_rows: payload.total,
      success_rows: payload.success,
      failed_rows: payload.errors.length,
      errors: payload.errors,
    });
};

const insertRecords = async (
  client: SupabaseClient<Database>,
  type: ImportType,
  orgId: string,
  records: Record<string, any>[],
  useRpc: boolean
) => {
  if (useRpc && typeof client.rpc === "function") {
    const { error } = await client.rpc("run_atomic_import", {
      target_table: type,
      records,
      p_organization_id: orgId,
    } as any);

    if (error) {
      throw new ImportError(error.message);
    }
    return;
  }

  const { error } = await tenantTable(client, orgId, type).insert(records, { returning: "minimal" });
  if (error) {
    throw new ImportError(error.message);
  }
};

export const runImport = async (request: ImportRequest): Promise<ImportResponse> => {
  const orgId = requireOrgId(request.orgId);
  const validator = getValidator(request.type);

  if (!validator) {
    throw new ImportError(`Unsupported import type: ${request.type}`);
  }

  const client = ensureSupabaseClient(request.supabase);
  const errors: ImportFieldError[] = [];
  const sanitizedRecords: Record<string, any>[] = [];

  request.rows.forEach((row, index) => {
    const result = validator.validateRecord(row, orgId, index + 2);
    if (!result.ok) {
      errors.push(...result.errors);
    } else {
      sanitizedRecords.push(result.record);
    }
  });

  if (errors.length) {
    await writeAuditLog(client, {
      orgId,
      userId: request.userId,
      type: request.type,
      total: request.rows.length,
      success: 0,
      errors,
    });
    return {
      ok: false,
      message: "Import failed",
      errors,
      inserted: 0,
    };
  }

  for (const [rowIndex, record] of sanitizedRecords.entries()) {
    for (const rule of validator.foreignKeys ?? []) {
      const value = (record as any)[rule.field];
      if (!value) continue;

      const ownership = await verifyOwnership(client, orgId, rule.table, value);
      if (!ownership.ok) {
        errors.push({
          row: rowIndex + 2,
          field: rule.field,
          error: rule.message ?? `${rule.field} does not belong to your organization.`,
        });
      }
    }
  }

  if (errors.length) {
    await writeAuditLog(client, {
      orgId,
      userId: request.userId,
      type: request.type,
      total: request.rows.length,
      success: 0,
      errors,
    });
    return {
      ok: false,
      message: "Import failed",
      errors,
      inserted: 0,
    };
  }

  try {
    await insertRecords(client, request.type, orgId, sanitizedRecords, request.useRpcAtomic ?? true);
    await writeAuditLog(client, {
      orgId,
      userId: request.userId,
      type: request.type,
      total: request.rows.length,
      success: sanitizedRecords.length,
      errors: [],
    });
    return {
      ok: true,
      message: "Import completed",
      inserted: sanitizedRecords.length,
    };
  } catch (error) {
    const formatted = error instanceof ImportError ? error : new ImportError("Import failed");
    await writeAuditLog(client, {
      orgId,
      userId: request.userId,
      type: request.type,
      total: request.rows.length,
      success: 0,
      errors: formatted.details ?? [],
    });
    return {
      ok: false,
      message: formatted.message,
      errors: formatted.details ?? [],
      inserted: 0,
    };
  }
};
