import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from './useOrganizationId';

export function useJobSearch(jobId?: string) {
  const { orgId } = useOrganizationId();
  return useQuery({
    queryKey: ['job-search', orgId, jobId],
    queryFn: async () => {
      if (!jobId || !orgId) return null;
      
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
        .eq('organization_id', orgId)
        .eq('job_number', jobId)
        .maybeSingle();
      
      console.log('Exact match result:', data);
      
      // If no exact match, try case-insensitive match of the full job number
      if (!data) {
        console.log('Trying case-insensitive match for:', jobId);
        ({ data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            customers(id, name, service_street, service_city, service_state),
            profiles:driver_id(id, first_name, last_name),
            vehicles(id, license_plate, vehicle_type)
          `)
          .eq('organization_id', orgId)
          .ilike('job_number', jobId)
          .maybeSingle());
      }
      
      console.log('Final search result:', data);
      if (error) {
        console.error('Job search error:', error);
        throw error;
      }
      return data;
    },
    enabled: !!orgId && !!jobId && jobId.length >= 6 && /^[A-Z]{3}-\d+$/i.test(jobId),
  });
}