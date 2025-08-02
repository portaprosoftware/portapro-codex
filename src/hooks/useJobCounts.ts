import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForQuery } from '@/lib/dateUtils';
import { subDays, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

export function useJobCounts() {
  return useQuery({
    queryKey: ['job-counts'],
    queryFn: async () => {
      const today = new Date();
      const last7Days = subDays(today, 7);
      const last30Days = subDays(today, 30);
      const monthStart = startOfMonth(today);
      const quarterStart = startOfQuarter(today);
      const yearStart = startOfYear(today);

      // Get total jobs
      const { data: totalJobs, error: totalError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get today's jobs
      const { data: todayJobs, error: todayError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('scheduled_date', formatDateForQuery(today));

      if (todayError) throw todayError;

      // Get last 7 days
      const { data: last7DaysJobs, error: last7Error } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', formatDateForQuery(last7Days))
        .lte('scheduled_date', formatDateForQuery(today));

      if (last7Error) throw last7Error;

      // Get last 30 days
      const { data: last30DaysJobs, error: last30Error } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', formatDateForQuery(last30Days))
        .lte('scheduled_date', formatDateForQuery(today));

      if (last30Error) throw last30Error;

      // Get month to date
      const { data: monthToDateJobs, error: monthError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', formatDateForQuery(monthStart))
        .lte('scheduled_date', formatDateForQuery(today));

      if (monthError) throw monthError;

      // Get quarter to date
      const { data: quarterToDateJobs, error: quarterError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', formatDateForQuery(quarterStart))
        .lte('scheduled_date', formatDateForQuery(today));

      if (quarterError) throw quarterError;

      // Get year to date
      const { data: yearToDateJobs, error: yearError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', formatDateForQuery(yearStart))
        .lte('scheduled_date', formatDateForQuery(today));

      if (yearError) throw yearError;

      return {
        total: totalJobs || 0,
        today: todayJobs || 0,
        last7Days: last7DaysJobs || 0,
        last30Days: last30DaysJobs || 0,
        monthToDate: monthToDateJobs || 0,
        quarterToDate: quarterToDateJobs || 0,
        yearToDate: yearToDateJobs || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}