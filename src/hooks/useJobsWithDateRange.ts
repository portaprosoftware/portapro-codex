import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useJobsWithDateRange(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  driver_id?: string;
  job_type?: string;
  job_id?: string;
}) {
  // Ensure filters are serializable for React Query
  const serializedFilters = filters ? {
    startDate: filters.startDate,
    endDate: filters.endDate,
    status: filters.status,
    driver_id: filters.driver_id,
    job_type: filters.job_type,
    job_id: filters.job_id
  } : undefined;

  return useQuery({
    queryKey: ['jobs-date-range', serializedFilters],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          customers(id, name, service_street, service_city, service_state),
          profiles:driver_id(id, first_name, last_name),
          vehicles(id, license_plate, vehicle_type)
        `)
        .order('scheduled_date', { ascending: false });

      if (filters?.startDate && filters?.endDate) {
        query = query.gte('scheduled_date', filters.startDate).lte('scheduled_date', filters.endDate);
      }
      
      if (filters?.status && ['assigned', 'unassigned', 'in_progress', 'completed', 'cancelled'].includes(filters.status)) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }
      
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type);
      }

      if (filters?.job_id) {
        query = query.ilike('job_number', `%${filters.job_id}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!(filters?.startDate && filters?.endDate), // Only run if date range is provided
  });
}