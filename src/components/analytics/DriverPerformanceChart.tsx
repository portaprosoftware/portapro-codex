import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Trophy, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface DriverPerformanceChartProps {
  dateRange: { from: Date; to: Date };
}

export const DriverPerformanceChart: React.FC<DriverPerformanceChartProps> = ({ dateRange }) => {
  const { data: driverPerformance, isLoading } = useQuery({
    queryKey: ['driver-performance', dateRange],
    queryFn: async () => {
      // Get jobs data with driver information
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          driver_id,
          status,
          scheduled_date,
          actual_completion_time,
          was_overdue,
          created_at
        `)
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'))
        .not('driver_id', 'is', null);

      if (error) throw error;

      // Get driver names from user_roles and try to get profile information
      const { data: drivers, error: driversError } = await supabase
        .from('user_roles')
        .select('user_id, clerk_user_id')
        .eq('role', 'driver');

      if (driversError) throw driversError;

      // Create a mapping of driver IDs to names
      const driverNameMap: Record<string, string> = {};
      
      // First, try to get driver names from any available source
      if (drivers) {
        for (const driver of drivers) {
          // If clerk_user_id exists, use a simple format
          if (driver.clerk_user_id) {
            driverNameMap[driver.user_id] = `Driver ${driver.clerk_user_id.replace('temp_', '')}`;
          } else {
            // Use a shortened version of the UUID for display
            const shortId = driver.user_id.split('-')[0];
            driverNameMap[driver.user_id] = `Driver ${shortId.substring(0, 6).toUpperCase()}`;
          }
        }
      }

      // Calculate performance metrics per driver
      const driverMetrics = data?.reduce((acc, job) => {
        if (!job.driver_id) return acc;
        
        if (!acc[job.driver_id]) {
          acc[job.driver_id] = {
            driver_id: job.driver_id,
            driver_name: driverNameMap[job.driver_id] || `Driver ${job.driver_id.substring(0, 6).toUpperCase()}`,
            total_jobs: 0,
            completed_jobs: 0,
            overdue_jobs: 0,
            completion_rate: 0,
            efficiency_score: 0
          };
        }

        acc[job.driver_id].total_jobs++;
        
        if (job.status === 'completed') {
          acc[job.driver_id].completed_jobs++;
        }
        
        if (job.was_overdue) {
          acc[job.driver_id].overdue_jobs++;
        }

        // Calculate completion rate
        acc[job.driver_id].completion_rate = 
          (acc[job.driver_id].completed_jobs / acc[job.driver_id].total_jobs) * 100;
        
        // Calculate efficiency score (completion rate - overdue penalty)
        const overdueRate = (acc[job.driver_id].overdue_jobs / acc[job.driver_id].total_jobs) * 100;
        acc[job.driver_id].efficiency_score = 
          Math.max(0, acc[job.driver_id].completion_rate - (overdueRate * 0.5));

        return acc;
      }, {} as Record<string, any>) || {};

      // Convert to array and sort by efficiency score
      return Object.values(driverMetrics)
        .sort((a: any, b: any) => b.efficiency_score - a.efficiency_score)
        .slice(0, 8); // Top 8 drivers
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-blue-600" />
          Driver Performance
        </h3>
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500">Loading driver performance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-blue-600" />
        Driver Performance
      </h3>
      <p className="text-sm text-gray-600 mb-4">Top performing drivers by efficiency score</p>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {driverPerformance?.map((driver: any, index: number) => (
          <div key={driver.driver_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                index === 0 ? 'bg-gradient-gold' :
                index === 1 ? 'bg-gradient-silver' :
                index === 2 ? 'bg-gradient-bronze' :
                'bg-gradient-blue'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{driver.driver_name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {driver.total_jobs} jobs assigned
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {driver.efficiency_score.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {driver.completion_rate.toFixed(1)}% completion
                  </p>
                </div>
              </div>
              
              {driver.overdue_jobs > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {driver.overdue_jobs} overdue
                </div>
              )}
            </div>
          </div>
        ))}
        
        {(!driverPerformance || driverPerformance.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No driver performance data available</p>
            <p className="text-xs mt-1">Performance metrics will appear once drivers complete jobs</p>
          </div>
        )}
      </div>
    </div>
  );
};