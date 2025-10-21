import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, format } from 'date-fns-tz';

/**
 * Hook to get the company timezone from settings
 */
export const useCompanyTimezone = () => {
  return useQuery({
    queryKey: ['company-timezone'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_timezone')
        .single();
      
      if (error) throw error;
      return data?.company_timezone || 'America/New_York'; // Default fallback
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Hook to get today's date in the company timezone (YYYY-MM-DD format)
 */
export const useTodayInCompanyTimezone = () => {
  const { data: timezone, isLoading } = useCompanyTimezone();
  
  const getTodayString = () => {
    if (!timezone) return new Date().toISOString().split('T')[0]; // Fallback to local
    
    try {
      // Get current UTC time
      const now = new Date();
      // Convert to company timezone
      const zonedDate = toZonedTime(now, timezone);
      // Format as YYYY-MM-DD
      return format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });
    } catch (error) {
      console.error('Error formatting date in company timezone:', error);
      return new Date().toISOString().split('T')[0]; // Fallback
    }
  };
  
  return {
    today: getTodayString(),
    timezone,
    isLoading
  };
};
