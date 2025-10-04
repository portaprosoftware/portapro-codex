import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleSummaryData {
  maintenance: {
    open_work_orders: number;
    dvirs_30d: number;
    last_dvir: {
      date: string;
      status: string;
    } | null;
    next_pm_due: {
      name: string;
      due_value: number;
      trigger_type: string;
    } | null;
  };
  fuel: {
    last_fill_date: string | null;
    last_fill_gallons: number | null;
    avg_mpg_30d: number | null;
    total_spent_30d: number;
  };
  compliance: {
    spill_kit_status: 'compliant' | 'missing';
    last_kit_check: string | null;
    incidents_30d: number;
    decon_logs_30d: number;
  };
  documents: {
    total_count: number;
    expiring_soon: number;
  };
  stock: {
    todays_load: number;
  };
  assignments: {
    active_count: number;
    upcoming_jobs: number;
  };
}

export function useVehicleSummary(vehicleId: string | null) {
  return useQuery({
    queryKey: ['vehicle-summary', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;

      const { data, error } = await supabase
        .rpc('get_vehicle_summary', { p_vehicle_id: vehicleId });

      if (error) throw error;
      return data as unknown as VehicleSummaryData;
    },
    enabled: !!vehicleId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
