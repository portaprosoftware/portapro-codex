import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useOrganizationId } from './useOrganizationId';

export function useDriverVehicleAssignments(date: string = new Date().toISOString().split('T')[0]) {
  const { user } = useUser();
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['driver-vehicle-assignments', orgId, user?.id, date],
    queryFn: async () => {
      if (!user?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('daily_vehicle_assignments')
        .select(`
          *,
          vehicles:vehicle_id (
            id,
            license_plate,
            make,
            model,
            year,
            vehicle_type,
            status,
            vin,
            last_known_location
          )
        `)
        .eq('organization_id', orgId)
        .eq('driver_id', user.id)
        .eq('assignment_date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}