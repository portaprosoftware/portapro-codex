import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WorkOrder } from '@/components/fleet/work-orders/types';

interface UseVehicleWorkOrdersOptions {
  vehicleId: string | null;
  limit?: number;
  offset?: number;
  status?: string;
}

export function useVehicleWorkOrders({
  vehicleId,
  limit = 25,
  offset = 0,
  status,
}: UseVehicleWorkOrdersOptions) {
  return useQuery({
    queryKey: ['vehicle-work-orders', vehicleId, limit, offset, status],
    queryFn: async () => {
      if (!vehicleId) return { items: [], total: 0 };

      let query = supabase
        .from('work_orders')
        .select('*', { count: 'exact' })
        .eq('asset_id', vehicleId)
        .eq('asset_type', 'vehicle')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status as any);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        items: (data || []) as any as WorkOrder[],
        total: count || 0,
      };
    },
    enabled: !!vehicleId,
    staleTime: 30000,
  });
}
