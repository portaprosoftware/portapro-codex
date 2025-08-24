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

      // Analyze by hour of day using actual scheduled times
      const hourCounts: { [hour: number]: number } = {};
      
      // Initialize business hours (8 AM to 5 PM)
      for (let i = 8; i <= 17; i++) {
        hourCounts[i] = 0;
      }

      // Count jobs by actual scheduled hour, or distribute evenly if no time specified
      jobs?.forEach(job => {
        if (job.scheduled_time) {
          // Parse the time and extract hour
          const timeParts = job.scheduled_time.split(':');
          const hour = parseInt(timeParts[0]);
          if (hour >= 8 && hour <= 17) {
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
        } else {
          // If no specific time, distribute across business hours
          const businessHours = Object.keys(hourCounts).map(h => parseInt(h));
          const randomHour = businessHours[Math.floor(Math.random() * businessHours.length)];
          hourCounts[randomHour] = (hourCounts[randomHour] || 0) + 1;
        }
      });

      const hourlyDistribution = Object.entries(hourCounts).map(([hour, jobs]) => {
        const hourNum = parseInt(hour);
        const hourLabel = hourNum <= 12 ? `${hourNum}AM` : `${hourNum - 12}PM`;
        
        return {
          hour: hourLabel,
          jobs: jobs,
          utilization: Math.min(100, (jobs / Math.max(1, 5)) * 100) // Assuming max 5 jobs per hour is 100%
        };
      }).sort((a, b) => {
        const aHour = parseInt(a.hour.replace(/AM|PM/, ''));
        const bHour = parseInt(b.hour.replace(/AM|PM/, ''));
        return aHour - bHour;
      });

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
      const peakHour = hourlyDistribution.reduce((max, current) => 
        current.jobs > max.jobs ? current : max
      );

      return {
        hourlyDistribution,
        insights: {
          peakHour: peakHour.hour,
          peakJobs: peakHour.jobs,
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
          <div>Jobs with specific times: <span className="font-medium">{insights.jobsWithSpecificTimes || 0}</span></div>
          <div>Jobs with estimated times: <span className="font-medium">{insights.jobsWithoutTimes || 0}</span></div>
          <div className="text-gray-500 italic">
            * Jobs without specific times are distributed across business hours for visualization
          </div>
        </div>
      </div>

      {/* Hourly Distribution Chart */}
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
                name === 'jobs' ? 'Jobs' : 'Utilization %'
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
    </div>
  );
};