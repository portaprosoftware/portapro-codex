import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useJobSearch(jobId?: string) {
  return useQuery({
    queryKey: ['job-search', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      
      // First try exact match
      let { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers(id, name, service_street, service_city, service_state),
          profiles:driver_id(id, first_name, last_name),
          vehicles(id, license_plate, vehicle_type)
        `)
        .eq('job_number', jobId)
        .maybeSingle();
      
      // If no exact match and looks like a complete job ID (contains dash and numbers), try starts-with
      if (!data && jobId.includes('-') && /\d/.test(jobId)) {
        ({ data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            customers(id, name, service_street, service_city, service_state),
            profiles:driver_id(id, first_name, last_name),
            vehicles(id, license_plate, vehicle_type)
          `)
          .ilike('job_number', `${jobId}%`)
          .order('scheduled_date', { ascending: false })
          .limit(1)
          .maybeSingle());
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && jobId.length > 4 && (jobId.includes('-') || /^\w{3,}-?\d/.test(jobId)),
  });
}