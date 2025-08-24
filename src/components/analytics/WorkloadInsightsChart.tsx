import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Clock, TrendingUp, Users } from 'lucide-react';

interface WorkloadInsightsChartProps {
  dateRange: { from: Date; to: Date };
}

export const WorkloadInsightsChart: React.FC<WorkloadInsightsChartProps> = ({ dateRange }) => {
  const { data: workloadData, isLoading } = useQuery({
    queryKey: ['workload-insights', dateRange],
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('scheduled_date, created_at, driver_id, scheduled_time, job_type')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (error) throw error;

      // Count jobs with specific times vs estimated times
      const jobsWithSpecificTimes = jobs?.filter(job => job.scheduled_time).length || 0;
      const jobsWithoutTimes = (jobs?.length || 0) - jobsWithSpecificTimes;

      // Analyze by hour of day using ONLY actual scheduled times
      const hourCounts: { [hour: number]: number } = {};
      
      // Count jobs by actual scheduled hour ONLY
      jobs?.forEach(job => {
        if (job.scheduled_time) {
          const timeParts = job.scheduled_time.split(':');
          const hour = parseInt(timeParts[0]);
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
        // NO fake distribution for jobs without times
      });

      // Create hourly distribution only for hours that have actual data
      const hourlyDistribution = Object.entries(hourCounts).map(([hour, jobs]) => {
        const hourNum = parseInt(hour);
        const hourLabel = hourNum === 0 ? '12AM' : 
                         hourNum <= 12 ? `${hourNum}AM` : 
                         `${hourNum - 12}PM`;
        
        return {
          hour: hourLabel,
          jobs: jobs,
          hourNum: hourNum
        };
      }).sort((a, b) => a.hourNum - b.hourNum);

      // Get driver utilization - only count jobs with assigned drivers
      const jobsWithDrivers = jobs?.filter(job => job.driver_id) || [];
      const driverStats = jobsWithDrivers.reduce((acc: any, job) => {
        if (job.driver_id) {
          acc[job.driver_id] = (acc[job.driver_id] || 0) + 1;
        }
        return acc;
      }, {});

      const uniqueDrivers = Object.keys(driverStats).length;
      const averageJobsPerDriver = uniqueDrivers > 0 ? jobsWithDrivers.length / uniqueDrivers : 0;
      
      // Only calculate peak hour if we have actual time data
      const peakHour = hourlyDistribution.length > 0 
        ? hourlyDistribution.reduce((max, current) => current.jobs > max.jobs ? current : max)
        : { hour: 'N/A', jobs: 0 };

      return {
        hourlyDistribution,
        insights: {
          peakHour: peakHour.hour,
          peakJobs: peakHour.jobs || 0,
          activeDrivers: uniqueDrivers,
          avgJobsPerDriver: Math.round(averageJobsPerDriver * 10) / 10,
          totalJobs: jobs?.length || 0,
          jobsWithSpecificTimes,
          jobsWithoutTimes
        }
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workload insights...</div>
      </div>
    );
  }

  const { hourlyDistribution, insights } = workloadData || { hourlyDistribution: [], insights: {} };

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Peak Hour</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {insights.peakHour || 'N/A'}
          </div>
          <div className="text-xs text-blue-600">
            {insights.peakJobs || 0} jobs
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Active Drivers</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {insights.activeDrivers || 0}
          </div>
          <div className="text-xs text-green-600">
            {insights.avgJobsPerDriver || 0} avg jobs
          </div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-purple-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Total Jobs</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {insights.totalJobs || 0}
          </div>
          <div className="text-xs text-purple-600">
            This period
          </div>
        </div>
      </div>

      {/* Job Timing Information */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Job Timing Analysis</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Jobs with scheduled times: <span className="font-medium">{insights.jobsWithSpecificTimes || 0}</span></div>
          <div>Jobs without scheduled times: <span className="font-medium">{insights.jobsWithoutTimes || 0}</span></div>
          {(insights.jobsWithSpecificTimes || 0) === 0 && (
            <div className="text-amber-600 italic">
              No hourly distribution available - no jobs have specific scheduled times
            </div>
          )}
        </div>
      </div>

      {/* Hourly Distribution Chart - Only show if we have time data */}
      {(insights.jobsWithSpecificTimes || 0) > 0 ? (
        <div className="h-64">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Hourly Job Distribution</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  value,
                  name === 'jobs' ? 'Jobs' : 'Jobs'
                ]}
              />
              <Bar 
                dataKey="jobs" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="Jobs"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <p className="text-sm">No hourly distribution data available</p>
            <p className="text-xs mt-1">Jobs need specific scheduled times to show this chart</p>
          </div>
        </div>
      )}
    </div>
  );
};