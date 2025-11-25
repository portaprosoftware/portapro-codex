import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { Database } from '@/integrations/supabase/types';

export const useTenantId = () => {
  const { organization } = useOrganizationContext();
  return organization?.id ?? null;
};

export const useTenantQuery = () => {
  const tenantId = useTenantId();

  const fromTenant = <T extends keyof Database['public']['Tables']>(table: T) => {
    if (!tenantId) throw new Error('Tenant ID is required for scoped queries');
    return supabase.from(table).eq('organization_id', tenantId);
  };

  const withTenant = <
    T extends keyof Database['public']['Tables'],
    R,
    Relationships extends Record<string, unknown> = Database['public']['Tables'][T] extends { Relationships: infer Rel }
      ? Rel
      : Record<string, never>
  >(
    query: PostgrestFilterBuilder<Database['public'], Relationships, R>
  ) => {
    if (!tenantId) {
      throw new Error('Tenant ID is required for scoped queries');
    }
    return query.eq('organization_id', tenantId);
  };

  return { tenantId, fromTenant, withTenant };
};
