import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface VehicleActivity {
  vehicle_id: string;
  activity_type: string;
  activity_id: string;
  activity_date: string;
  activity_summary: string;
  rn: number;
}

export function useVehicleActivity(vehicleId: string | null, limit: number = 10, enabled: boolean = true) {
  const queryClient = useQueryClient();

  // Set up realtime subscriptions for activity-related tables
  useEffect(() => {
    if (!vehicleId || !enabled) return;

    const channels = [
      // Subscribe to work orders
      supabase
        .channel(`work_orders_${vehicleId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'work_orders',
            filter: `asset_id=eq.${vehicleId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleId, limit] });
          }
        )
        .subscribe(),

      // Subscribe to DVIR reports
      supabase
        .channel(`dvir_reports_${vehicleId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dvir_reports',
            filter: `asset_id=eq.${vehicleId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleId, limit] });
          }
        )
        .subscribe(),

      // Subscribe to fuel consumption
      supabase
        .channel(`unified_fuel_consumption_${vehicleId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'unified_fuel_consumption',
            filter: `vehicle_id=eq.${vehicleId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleId, limit] });
          }
        )
        .subscribe(),

      // Subscribe to spill incidents
      supabase
        .channel(`spill_incidents_${vehicleId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'spill_incidents',
            filter: `vehicle_id=eq.${vehicleId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleId, limit] });
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [vehicleId, enabled, limit, queryClient]);

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
    enabled: !!vehicleId && enabled,
    staleTime: 30 * 1000, // 30 seconds - more responsive for activity
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 60 * 1000, // Auto-refetch every 60 seconds
  });
}
