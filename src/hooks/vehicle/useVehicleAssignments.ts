import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';

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
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['vehicle-assignments', vehicleId, orgId, limit, offset],
    queryFn: async () => {
      if (!vehicleId || !orgId) return { items: [], total: 0 };

      const { data, error, count } = await supabase
        .from('vehicle_assignments')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .eq('organization_id', orgId)
        .order('assignment_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
      };
    },
    enabled: !!vehicleId && !!orgId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
