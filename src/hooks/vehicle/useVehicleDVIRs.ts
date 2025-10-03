import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseVehicleDVIRsOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
}

export function useVehicleDVIRs({
  vehicleId,
  limit = 25,
  offset = 0,
  enabled = true,
}: UseVehicleDVIRsOptions & { enabled?: boolean }) {
  return useQuery({
    queryKey: ['vehicle-dvirs', vehicleId, limit, offset],
    queryFn: async () => {
      if (!vehicleId) return { items: [], total: 0 };

      const { data, error, count } = await supabase
        .from('dvir_reports')
        .select('*', { count: 'exact' })
        .eq('asset_id', vehicleId)
        .eq('asset_type', 'vehicle')
        .order('created_at', { ascending: false })
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
