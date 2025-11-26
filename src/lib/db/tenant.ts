import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';

interface OrgContext {
  orgId?: string | null;
}

type InsertOptions = { returning?: 'minimal' | 'representation' | 'headers-only' } & Record<string, unknown>;

type TenantInsertInput<T> = T | T[];

type TenantTable<Client extends SupabaseClient<any, any, any>, TableName extends string> = {
  select: Client['from'] extends (table: TableName) => infer Builder
    ? Builder extends { select: (...args: any[]) => infer SelectBuilder }
      ? (...args: Parameters<Builder['select']>) => SelectBuilder extends { eq: (...args: any[]) => any }
        ? ReturnType<SelectBuilder['eq']>
        : SelectBuilder
      : (...args: any[]) => any
    : (...args: any[]) => any;
  insert: <T>(values: TenantInsertInput<T>, options?: InsertOptions) => PostgrestSingleResponse<any> | Promise<PostgrestSingleResponse<any>>;
  update: Client['from'] extends (table: TableName) => infer Builder
    ? Builder extends { update: (...args: any[]) => infer UpdateBuilder }
      ? (values: Parameters<Builder['update']>[0]) => UpdateBuilder extends { eq: (...args: any[]) => any }
        ? ReturnType<UpdateBuilder['eq']>
        : UpdateBuilder
      : (values: any) => any
    : (values: any) => any;
  delete: Client['from'] extends (table: TableName) => infer Builder
    ? Builder extends { delete: (...args: any[]) => infer DeleteBuilder }
      ? () => DeleteBuilder extends { eq: (...args: any[]) => any }
        ? ReturnType<DeleteBuilder['eq']>
        : DeleteBuilder
      : () => any
    : () => any;
};

export function requireOrgId(context: OrgContext | null | undefined): string {
  const orgId = context?.orgId;

  if (!orgId) {
    throw new Error('Organization ID required');
  }

  return orgId;
}

export function tenantTable<Client extends SupabaseClient<any, any, any>, TableName extends string>(
  client: Client,
  orgId: string,
  tableName: TableName
): TenantTable<Client, TableName> {
  const table = client.from(tableName) as any;

  const withOrgId = <T>(values: TenantInsertInput<T>) => {
    const records = Array.isArray(values) ? values : [values];

    const recordsWithOrg = records.map(record => ({
      ...record,
      organization_id: orgId,
    }));

    return Array.isArray(values) ? recordsWithOrg : recordsWithOrg[0];
  };

  return {
    select: (...args: any[]) => table.select(...args).eq('organization_id', orgId),
    insert: (values: any, options?: InsertOptions) => table.insert(withOrgId(values), options),
    update: (values: any) => table.update(values).eq('organization_id', orgId),
    delete: () => table.delete().eq('organization_id', orgId),
  };
}
