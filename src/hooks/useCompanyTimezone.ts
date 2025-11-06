import { toZonedTime, format } from 'date-fns-tz';
import { useCompanySettings } from './useCompanySettings';

/**
 * Hook to get the company timezone from settings
 * Uses shared cache from useCompanySettings to prevent duplicate queries
 */
export const useCompanyTimezone = () => {
  const { data: companySettings, isLoading } = useCompanySettings();
  
  return {
    data: companySettings?.company_timezone || 'America/New_York',
    isLoading,
  };
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
