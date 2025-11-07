import { supabase } from '@/integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Safe insert helper that enforces organization_id requirement
 * Prevents multi-tenant data leakage by validating orgId before insert
 * 
 * @param table - The Supabase table name
 * @param data - The data to insert (single object or array)
 * @param orgId - The organization ID (required)
 * @returns Supabase insert response
 * 
 * @example
 * const { error } = await safeInsert('storage_locations', locationData, orgId);
 */
export async function safeInsert<T extends Record<string, any>>(
  table: string,
  data: T | T[],
  orgId: string | null
) {
  if (!orgId) {
    throw new Error('Multi-tenant data isolation requires organization_id to be set');
  }

  const records = Array.isArray(data) ? data : [data];
  const recordsWithOrg = records.map(record => ({
    ...record,
    organization_id: orgId
  }));

  return (supabase as any).from(table).insert(recordsWithOrg);
}

/**
 * Safe update helper that enforces organization_id filtering
 * Ensures updates are scoped to the correct organization
 * 
 * @param table - The Supabase table name
 * @param data - The update data
 * @param orgId - The organization ID (required)
 * @param matchConditions - Additional WHERE conditions
 * @returns Supabase update response
 * 
 * @example
 * const { error } = await safeUpdate('storage_locations', { name: 'New Name' }, orgId, { id: locationId });
 */
export async function safeUpdate<T extends Record<string, any>>(
  table: string,
  data: T,
  orgId: string | null,
  matchConditions: Record<string, any>
) {
  if (!orgId) {
    throw new Error('Multi-tenant data isolation requires organization_id to be set');
  }

  let query = (supabase as any)
    .from(table)
    .update(data)
    .eq('organization_id', orgId);

  // Apply additional match conditions
  Object.entries(matchConditions).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  return query;
}

/**
 * Safe delete helper that enforces organization_id filtering
 * Ensures deletes are scoped to the correct organization
 * 
 * @param table - The Supabase table name
 * @param orgId - The organization ID (required)
 * @param matchConditions - WHERE conditions for delete
 * @returns Supabase delete response
 * 
 * @example
 * const { error } = await safeDelete('storage_locations', orgId, { id: locationId });
 */
export async function safeDelete(
  table: string,
  orgId: string | null,
  matchConditions: Record<string, any>
) {
  if (!orgId) {
    throw new Error('Multi-tenant data isolation requires organization_id to be set');
  }

  let query = (supabase as any)
    .from(table)
    .delete()
    .eq('organization_id', orgId);

  // Apply additional match conditions
  Object.entries(matchConditions).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  return query;
}

/**
 * Safe read helper that enforces organization_id filtering
 * Prevents cross-tenant data leakage by scoping all SELECT queries
 * 
 * @param table - The Supabase table name
 * @param orgId - The organization ID (required)
 * @param additionalFilters - Additional WHERE conditions
 * @returns Supabase query builder
 * 
 * @example
 * const { data } = await safeRead('vehicles', orgId, { status: 'active' });
 */
export function safeRead(
  table: string,
  orgId: string | null,
  additionalFilters: Record<string, any> = {}
) {
  if (!orgId) {
    throw new Error('Multi-tenant data isolation requires organization_id to be set');
  }

  let query = (supabase as any)
    .from(table)
    .select('*')
    .eq('organization_id', orgId);

  // Apply additional filters
  Object.entries(additionalFilters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  return query;
}
