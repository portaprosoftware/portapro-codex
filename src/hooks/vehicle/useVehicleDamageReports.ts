import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['vehicle-damage-reports', vehicleId, limit, offset],
    queryFn: async () => {
      if (!vehicleId) return { items: [], total: 0 };

      // Query vehicle_damage_logs (this is the actual table name)
      const { data, error, count } = await supabase
        .from('vehicle_damage_logs')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .order('incident_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: (data || []) as any[],
        total: count || 0,
      };
    },
    enabled: !!vehicleId,
    staleTime: 30000,
  });
}
