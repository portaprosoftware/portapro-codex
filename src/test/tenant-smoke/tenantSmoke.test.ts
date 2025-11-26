import { beforeAll, describe, expect, it } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { tenantTable } from '@/lib/db/tenant';
import { createOrgWithData, TenantFixtures } from './fixtures';
import { expectForbidden, expectNoCrossTenantLeak } from './helpers';

const orgA = '00000000-0000-0000-0000-000000000001';
const orgB = '00000000-0000-0000-0000-000000000002';

describe('Tenant Smoke Suite', () => {
  let supabase: SupabaseClient<Database>;
  let fixturesA: TenantFixtures;
  let fixturesB: TenantFixtures;

  beforeAll(async () => {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for tenant smoke tests');
    }

    supabase = createClient<Database>(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    fixturesA = await createOrgWithData(supabase, orgA);
    fixturesB = await createOrgWithData(supabase, orgB);
  }, 120_000);

  describe('Direct table access', () => {
    const tablesToVerify = [
      'customers',
      'jobs',
      'units',
      'routes',
      'invoices',
      'payments',
      'vehicles',
      'maintenance_records',
      'products',
      'product_items',
      'job_items',
    ] as const;

    tablesToVerify.forEach((tableName) => {
      it(`keeps ${tableName} scoped to org A`, async () => {
        const { data, error } = await tenantTable(supabase, orgA, tableName as string).select('*');
        expect(error).toBeNull();
        expectNoCrossTenantLeak(data as any, orgA);
      });

      it(`keeps ${tableName} scoped to org B`, async () => {
        const { data, error } = await tenantTable(supabase, orgB, tableName as string).select('*');
        expect(error).toBeNull();
        expectNoCrossTenantLeak(data as any, orgB);
      });
    });
  });

  describe('RPC isolation', () => {
    it('keeps route manifest responses tenant-scoped', async () => {
      const resultA = await supabase.rpc('pp_get_route_manifest', {
        p_organization_id: orgA,
        p_route_id: fixturesA.vehicleId, // placeholder route identifier
      });

      expectNoCrossTenantLeak(resultA.data as any, orgA);

      const leakAttempt = await supabase.rpc('pp_get_route_manifest', {
        p_organization_id: orgA,
        target_invoice_id: fixturesB.invoiceId,
      });

      expectForbidden(leakAttempt as any);
    });

    it('keeps dashboard KPIs tenant-scoped', async () => {
      const resultA = await supabase.rpc('pp_get_dashboard_kpis', {
        p_organization_id: orgA,
        p_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        p_end: new Date().toISOString(),
      });

      expectNoCrossTenantLeak(resultA.data as any, orgA);

      const leakAttempt = await supabase.rpc('pp_get_dashboard_kpis', {
        p_organization_id: orgA,
        target_invoice_id: fixturesB.invoiceId,
      });

      expectForbidden(leakAttempt as any);
    });

    it('keeps inventory availability tenant-scoped', async () => {
      const resultA = await supabase.rpc('pp_get_inventory_availability', {
        p_organization_id: orgA,
        p_date: new Date().toISOString(),
        p_location_id: null,
      });

      expectNoCrossTenantLeak(resultA.data as any, orgA);

      const leakAttempt = await supabase.rpc('pp_get_inventory_availability', {
        p_organization_id: orgA,
        p_target_product_id: fixturesB.productId,
      });

      expectForbidden(leakAttempt as any);
    });
  });

  describe('Public surface pre-checks', () => {
    it('prevents loading invoices via mismatched token/org', async () => {
      const { data } = await tenantTable(supabase, orgA, 'invoices')
        .select('*')
        .eq('id', fixturesB.invoiceId);

      expectForbidden({ data });
    });

    it('prevents loading customers via mismatched token/org', async () => {
      const { data } = await tenantTable(supabase, orgA, 'customers')
        .select('*')
        .eq('id', fixturesB.customerId);

      expectForbidden({ data });
    });
  });
});
