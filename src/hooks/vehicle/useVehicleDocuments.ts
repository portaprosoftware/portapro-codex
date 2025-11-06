import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';

interface UseVehicleDocumentsOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useVehicleDocuments({
  vehicleId,
  limit = 25,
  offset = 0,
  enabled = true,
}: UseVehicleDocumentsOptions) {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['vehicle-documents', vehicleId, orgId, limit, offset],
    queryFn: async () => {
      if (!vehicleId || !orgId) return { items: [], total: 0 };

      const { data, error, count } = await supabase
        .from('vehicle_documents')
        .select('*', { count: 'exact' })
        .eq('vehicle_id', vehicleId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
      };
    },
    enabled: !!vehicleId && !!orgId && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - documents rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });
}
