import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleMetrics {
  vehicle_id: string;
  license_plate: string;
  open_work_orders: number;
  dvirs_last_30d: number;
  incidents_last_30d: number;
  decon_last_30d: number;
  docs_expiring_30d: number;
  last_dvir_date: string | null;
  last_dvir_status: string | null;
}

export function useVehicleMetrics(vehicleId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['vehicle-metrics', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;

      const { data, error } = await supabase
        .rpc('get_vehicle_metrics', { p_vehicle_id: vehicleId });

      if (error) throw error;
      
      // RPC returns an array, we need the first item
      const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return result as VehicleMetrics | null;
    },
    enabled: !!vehicleId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - metrics don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
  });
}
