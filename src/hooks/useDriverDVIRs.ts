import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useOrganizationId } from './useOrganizationId';

export function useDriverDVIRs(vehicleId?: string) {
  const { user } = useUser();
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['driver-dvirs', orgId, user?.id, vehicleId],
    queryFn: async () => {
      if (!user?.id || !orgId) return [];

      let query = supabase
        .from('dvir_reports')
        .select(`
          *,
          dvir_defects (
            id,
            item_key,
            severity,
            status,
            created_at
          )
        `)
        .eq('organization_id', orgId)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (vehicleId) {
        query = query.eq('asset_id', vehicleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}