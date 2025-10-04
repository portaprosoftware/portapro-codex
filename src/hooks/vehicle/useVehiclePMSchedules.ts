import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseVehiclePMSchedulesOptions {
  vehicleId: string | null;
  activeOnly?: boolean;
}

export function useVehiclePMSchedules({
  vehicleId,
  activeOnly = true
}: UseVehiclePMSchedulesOptions) {
  return useQuery({
    queryKey: ['vehicle-pm-schedules', vehicleId, activeOnly],
    queryFn: async () => {
      if (!vehicleId) return [];

      let query = supabase
        .from('pm_schedules' as any)
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('next_due_date', { ascending: true });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch templates separately
      if (data && data.length > 0) {
        const templateIds = data.map((s: any) => s.template_id).filter(Boolean);
        if (templateIds.length > 0) {
          const { data: templates, error: templatesError } = await supabase
            .from('pm_templates' as any)
            .select('id, name, category')
            .in('id', templateIds);

          if (!templatesError && templates) {
            // Merge templates into schedules
            return data.map((schedule: any) => ({
              ...schedule,
              pm_template: templates.find((t: any) => t.id === schedule.template_id)
            }));
          }
        }
      }

      return data || [];
    },
    enabled: !!vehicleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}
