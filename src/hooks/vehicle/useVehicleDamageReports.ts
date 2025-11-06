import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';

interface UseVehicleDamageReportsOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
}

export function useVehicleDamageReports({
  vehicleId,
  limit = 25,
  offset = 0,
}: UseVehicleDamageReportsOptions) {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['vehicle-damage-reports', vehicleId, orgId, limit, offset],
    queryFn: async () => {
      if (!vehicleId || !orgId) return { items: [], total: 0 };

      // Query vehicle_damage_logs (this is the actual table name)
      const { data, error, count } = await supabase
        .from('vehicle_damage_logs')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .eq('organization_id', orgId)
        .order('incident_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: (data || []) as any[],
        total: count || 0,
      };
    },
    enabled: !!vehicleId && !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
  });
}
