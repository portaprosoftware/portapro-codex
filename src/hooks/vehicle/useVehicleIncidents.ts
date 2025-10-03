import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseVehicleIncidentsOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useVehicleIncidents({
  vehicleId,
  limit = 25,
  offset = 0,
  enabled = true,
}: UseVehicleIncidentsOptions) {
  return useQuery({
    queryKey: ['vehicle-incidents', vehicleId, limit, offset],
    queryFn: async () => {
      if (!vehicleId) return { items: [], total: 0 };

      const { data, error, count } = await supabase
        .from('spill_incidents')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .order('incident_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
      };
    },
    enabled: !!vehicleId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
  });
}
