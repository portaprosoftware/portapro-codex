import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

export const useDriverJobs = () => {
  const { user } = useUser();
  const isDevelopment = import.meta.env.DEV;

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['driver-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ Driver Jobs: No user ID available');
        throw new Error('User not authenticated');
      }

      console.log('🔍 Driver Jobs: Fetching for user:', user.id);

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      console.log('📅 Driver Jobs: Date range:', { today, tomorrow: tomorrowStr });

      // Simplified query structure for reliability
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name,
            customer_type,
            phone,
            service_street,
            service_street2,
            service_city,
            service_state,
            service_zip
          ),
          customer_contacts (
            id,
            first_name,
            last_name,
            contact_type,
            email,
            phone,
            title
          )
        `)
        .eq('driver_id', user.id)
        .gte('scheduled_date', today)
        .lte('scheduled_date', tomorrowStr)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('❌ Driver Jobs: Query error:', error);
        
        // Try fallback query with profiles table
        console.log('🔄 Driver Jobs: Trying fallback query with profiles...');
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('❌ Driver Jobs: Profile lookup failed:', profileError);
          throw new Error(`Failed to fetch jobs: ${error.message}`);
        }

        if (!profileData) {
          console.log('⚠️ Driver Jobs: No profile found for user');
          return [];
        }

        console.log('✅ Driver Jobs: Found profile:', profileData.id);

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('jobs')
          .select(`
            *,
            customers (
              name,
              customer_type,
              phone,
              service_street,
              service_street2,
              service_city,
              service_state,
              service_zip
            ),
            customer_contacts (
              id,
              first_name,
              last_name,
              contact_type,
              email,
              phone,
              title
            )
          `)
          .eq('driver_id', profileData.id)
          .gte('scheduled_date', today)
          .lte('scheduled_date', tomorrowStr)
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true });

        if (fallbackError) {
          console.error('❌ Driver Jobs: Fallback query failed:', fallbackError);
          throw new Error(`Failed to fetch jobs: ${fallbackError.message}`);
        }

        console.log('✅ Driver Jobs: Fallback query successful, found:', fallbackData?.length || 0, 'jobs');
        return fallbackData || [];
      }

      console.log('✅ Driver Jobs: Direct query successful, found:', data?.length || 0, 'jobs');
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: isDevelopment ? 10 * 1000 : 30 * 1000, // 10s dev, 30s prod
    gcTime: isDevelopment ? 30 * 1000 : 60 * 1000, // 30s dev, 1min prod
    refetchOnMount: true,
    refetchOnWindowFocus: isDevelopment,
    retry: isDevelopment ? 1 : 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Log query state in development
  if (isDevelopment) {
    console.log('🔄 Driver Jobs Query State:', {
      isLoading,
      error: error?.message,
      jobCount: jobs?.length,
      userAuth: !!user?.id,
    });
  }

  return {
    jobs,
    isLoading,
    error,
    refetch,
  };
};