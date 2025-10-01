import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseVehicleFuelLogsOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
}

export function useVehicleFuelLogs({
  vehicleId,
  limit = 25,
  offset = 0,
}: UseVehicleFuelLogsOptions) {
  return useQuery({
    queryKey: ['vehicle-fuel-logs', vehicleId, limit, offset],
    queryFn: async () => {
      if (!vehicleId) return { items: [], total: 0 };

      const { data, error, count } = await supabase
        .from('fuel_logs')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .order('fuel_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
      };
    },
    enabled: !!vehicleId,
    staleTime: 30000,
  });
}
