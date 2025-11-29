import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types.js";
import { loadServerEnv } from "@/lib/config/env.js";
import { requireRole } from "@/lib/authz/requireRole.js";
import { tenantTable, requireOrgId } from "@/lib/db/tenant.js";
import { logAction } from "@/lib/audit/logger.js";
import { logSecurityEvent } from "@/lib/audit/securityLogger.js";

export type MutationContext = {
  userId?: string | null;
  orgId?: string | null;
  supabase?: SupabaseClient<Database>;
  request?: Request | null;
};

type MutationOperation = "insert" | "update" | "delete";

type MutationPayload<T> = T & { id?: string };

const MUTATION_ROLES = ["admin", "dispatcher"] as const;

const createServiceRoleClient = () => {
  const env = loadServerEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const withAuthorization = async <TReturn>(
  tableName: keyof Database["public"]["Tables"],
  operation: MutationOperation,
  context: MutationContext,
  handler: (client: SupabaseClient<Database>, orgId: string) => Promise<TReturn>
) => {
  const client = context.supabase ?? createServiceRoleClient();
  let orgId: string;

  try {
    orgId = requireOrgId(context.orgId);
  } catch (error) {
    await logSecurityEvent({
      orgId: context.orgId,
      type: "missing_org_id",
      source: "api",
      metadata: { tableName, operation },
      supabase: client,
    });
    throw error;
  }

  await requireRole({
    userId: context.userId,
    orgId,
    requiredRoles: MUTATION_ROLES,
    supabase: client,
  });

  return handler(client, orgId);
};

const performMutation = async <TPayload extends Record<string, any>>(
  tableName: keyof Database["public"]["Tables"],
  context: MutationContext,
  payload: MutationPayload<TPayload>,
  operation: MutationOperation
) => {
  return withAuthorization(tableName, operation, context, async (client, orgId) => {
    const table = tenantTable(client, orgId, tableName as string);

    switch (operation) {
      case "insert":
        return table.insert(payload).select().single().then(async (result) => {
          await logAction({
            orgId,
            userId: context.userId,
            action: `${operation}_${tableName}`,
            entityType: tableName as string,
            entityId: result.data?.id ?? payload.id ?? null,
            metadata: { operation, payload: { ...payload, id: payload.id } },
            request: context.request,
            supabase: client,
          });
          return result;
        });
      case "update":
        return table
          .update(payload)
          .eq("id", payload.id)
          .select()
          .single()
          .then(async (result) => {
            await logAction({
              orgId,
              userId: context.userId,
              action: `${operation}_${tableName}`,
              entityType: tableName as string,
              entityId: result.data?.id ?? payload.id ?? null,
              metadata: { operation, payload: { ...payload, id: payload.id } },
              request: context.request,
              supabase: client,
            });
            return result;
          });
      case "delete":
        return table
          .delete()
          .eq("id", payload.id)
          .then(async (result) => {
            await logAction({
              orgId,
              userId: context.userId,
              action: `${operation}_${tableName}`,
              entityType: tableName as string,
              entityId: payload.id ?? null,
              metadata: { operation, payload: { ...payload, id: payload.id } },
              request: context.request,
              supabase: client,
            });
            return result;
          });
    }
  });
};

export const createCustomer = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("customers", context, payload, "insert");

export const updateCustomer = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("customers", context, payload, "update");

export const deleteCustomer = (context: MutationContext, payload: { id: string }) =>
  performMutation("customers", context, payload, "delete");

export const createJob = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("jobs", context, payload, "insert");

export const updateJob = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("jobs", context, payload, "update");

export const deleteJob = (context: MutationContext, payload: { id: string }) =>
  performMutation("jobs", context, payload, "delete");

export const createInvoice = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("invoices", context, payload, "insert");

export const updateInvoice = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("invoices", context, payload, "update");

export const deleteInvoice = (context: MutationContext, payload: { id: string }) =>
  performMutation("invoices", context, payload, "delete");

export const createPayment = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("payments", context, payload, "insert");

export const updatePayment = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("payments", context, payload, "update");

export const deletePayment = (context: MutationContext, payload: { id: string }) =>
  performMutation("payments", context, payload, "delete");

export const createRoute = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("routes", context, payload, "insert");

export const updateRoute = (context: MutationContext, payload: Record<string, any>) =>
  performMutation("routes", context, payload, "update");

export const deleteRoute = (context: MutationContext, payload: { id: string }) =>
  performMutation("routes", context, payload, "delete");
