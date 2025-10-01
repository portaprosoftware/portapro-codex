import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseVehicleDeconLogsOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
}

export function useVehicleDeconLogs({
  vehicleId,
  limit = 25,
  offset = 0,
}: UseVehicleDeconLogsOptions) {
  return useQuery({
    queryKey: ['vehicle-decon-logs', vehicleId, limit, offset],
    queryFn: async () => {
      if (!vehicleId) return { items: [], total: 0 };

      const { data, error, count } = await supabase
        .from('decon_logs')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
      };
    },
    enabled: !!vehicleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
  });
}
