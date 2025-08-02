import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useJobSearch(jobId?: string) {
  return useQuery({
    queryKey: ['job-search', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      
      console.log('Job search triggered for:', jobId);
      
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
      
      console.log('Exact match result:', data);
      
      // Only try partial match if no exact match and job ID looks complete (at least 6-7 chars like DEL-012)
      if (!data && jobId.length >= 6 && jobId.includes('-') && /^[A-Z]{3}-\d+$/.test(jobId)) {
        console.log('Trying partial match for:', jobId);
        ({ data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            customers(id, name, service_street, service_city, service_state),
            profiles:driver_id(id, first_name, last_name),
            vehicles(id, license_plate, vehicle_type)
          `)
          .eq('job_number', jobId)
          .maybeSingle()); // Try exact match again in case of case sensitivity
        
        // If still no match, try case-insensitive exact match
        if (!data) {
          ({ data, error } = await supabase
            .from('jobs')
            .select(`
              *,
              customers(id, name, service_street, service_city, service_state),
              profiles:driver_id(id, first_name, last_name),
              vehicles(id, license_plate, vehicle_type)
            `)
            .ilike('job_number', jobId)
            .limit(1)
            .maybeSingle());
        }
      }
      
      console.log('Final search result:', data);
      if (error) {
        console.error('Job search error:', error);
        throw error;
      }
      return data;
    },
    enabled: !!jobId && jobId.length >= 6 && /^[A-Z]{3}-\d+$/i.test(jobId),
  });
}