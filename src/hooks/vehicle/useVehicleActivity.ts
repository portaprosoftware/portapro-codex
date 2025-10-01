import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleActivity {
  vehicle_id: string;
  activity_type: string;
  activity_id: string;
  activity_date: string;
  activity_summary: string;
  rn: number;
}

export function useVehicleActivity(vehicleId: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ['vehicle-activity', vehicleId, limit],
    queryFn: async () => {
      if (!vehicleId) return [];

      const { data, error } = await supabase
        .rpc('get_vehicle_activity', { 
          p_vehicle_id: vehicleId,
          p_limit: limit 
        });

      if (error) throw error;
      return (data || []) as VehicleActivity[];
    },
    enabled: !!vehicleId,
    staleTime: 30000,
  });
}
