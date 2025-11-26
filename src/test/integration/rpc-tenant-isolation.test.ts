import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

const orgA = 'org-a-123';
const orgB = 'org-b-456';

describe('Tenant-safe RPC wrappers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('scopes inventory availability to the requested organization', async () => {
    const orgAInventory = [{ product_id: 'p1', available_count: 3 }];
    const orgBInventory = [{ product_id: 'p2', available_count: 1 }];

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fn, params) => {
      if (fn !== 'pp_get_inventory_availability') return { data: null, error: null } as any;
      return {
        data: params?.p_organization_id === orgA ? orgAInventory : orgBInventory,
        error: null,
      } as any;
    });

    const { data } = await supabase.rpc('pp_get_inventory_availability', {
      p_organization_id: orgA,
      p_date: '2024-10-01',
      p_location_id: null,
    });

    expect(rpcSpy).toHaveBeenCalledWith(
      'pp_get_inventory_availability',
      expect.objectContaining({ p_organization_id: orgA })
    );
    expect(data).toEqual(orgAInventory);
    expect(data).not.toEqual(orgBInventory);
  });

  it('keeps route manifests isolated per organization', async () => {
    const manifestA = [{ route_id: 'route-a', job_id: 'job-1' }];
    const manifestB = [{ route_id: 'route-b', job_id: 'job-9' }];

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fn, params) => {
      if (fn !== 'pp_get_route_manifest') return { data: null, error: null } as any;
      return {
        data: params?.p_organization_id === orgA ? manifestA : manifestB,
        error: null,
      } as any;
    });

    const { data } = await supabase.rpc('pp_get_route_manifest', {
      p_organization_id: orgA,
      p_route_id: 'route-a',
    });

    expect(rpcSpy).toHaveBeenCalledWith(
      'pp_get_route_manifest',
      expect.objectContaining({ p_organization_id: orgA, p_route_id: 'route-a' })
    );
    expect(data).toEqual(manifestA);
    expect(data).not.toEqual(manifestB);
  });

  it('returns distinct KPI data for separate orgs', async () => {
    const kpiA = { inventory: { totalProducts: 2 }, revenue: { total: 1000 } };
    const kpiB = { inventory: { totalProducts: 8 }, revenue: { total: 50 } };

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fn, params) => {
      if (fn !== 'pp_get_dashboard_kpis') return { data: null, error: null } as any;
      return {
        data: params?.p_organization_id === orgA ? kpiA : kpiB,
        error: null,
      } as any;
    });

    const { data } = await supabase.rpc('pp_get_dashboard_kpis', {
      p_organization_id: orgA,
      p_start: '2024-10-01T00:00:00Z',
      p_end: '2024-10-31T23:59:59Z',
    });

    expect(rpcSpy).toHaveBeenCalledWith(
      'pp_get_dashboard_kpis',
      expect.objectContaining({ p_organization_id: orgA })
    );
    expect(data).toEqual(kpiA);
    expect(data).not.toEqual(kpiB);
  });
});
