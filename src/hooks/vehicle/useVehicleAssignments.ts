import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseVehicleAssignmentsOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useVehicleAssignments({
  vehicleId,
  limit = 25,
  offset = 0,
  enabled = true,
}: UseVehicleAssignmentsOptions) {
  return useQuery({
    queryKey: ['vehicle-assignments', vehicleId, limit, offset],
    queryFn: async () => {
      if (!vehicleId) return { items: [], total: 0 };

      const { data, error, count } = await supabase
        .from('vehicle_assignments')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .order('assignment_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
      };
    },
    enabled: !!vehicleId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
