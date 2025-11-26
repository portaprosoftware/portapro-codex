import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { loadServerEnv } from "@/lib/config/env";
import { requireRole } from "@/lib/authz/requireRole";
import { tenantTable, requireOrgId } from "@/lib/db/tenant";

export type MutationContext = {
  userId?: string | null;
  orgId?: string | null;
  supabase?: SupabaseClient<Database>;
};

type MutationOperation = "insert" | "update" | "delete";

type MutationPayload<T> = T & { id?: string };

const MUTATION_ROLES = ["org:owner", "org:admin", "org:dispatcher"];

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
  const orgId = requireOrgId(context.orgId);

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
        return table.insert(payload).select().single();
      case "update":
        return table.update(payload).eq("id", payload.id).select().single();
      case "delete":
        return table.delete().eq("id", payload.id);
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
