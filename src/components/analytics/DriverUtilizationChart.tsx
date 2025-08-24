import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, differenceInDays } from 'date-fns';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DriverUtilizationChartProps {
  dateRange: { from: Date; to: Date };
}

export const DriverUtilizationChart: React.FC<DriverUtilizationChartProps> = ({ dateRange }) => {
  const { data: utilizationData, isLoading } = useQuery({
    queryKey: ['driver-utilization', dateRange],
    queryFn: async () => {
      // Get all jobs in the date range
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          driver_id,
          scheduled_date,
          status,
          created_at
        `)
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (error) throw error;

      // Get total drivers
      const { data: allDrivers, error: driversError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');

      if (driversError) throw driversError;

      const totalDrivers = allDrivers?.length || 0;

      // Create daily utilization data
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const chartData = days.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const dayJobs = jobs?.filter(job => job.scheduled_date === dayString) || [];
        
        const assignedDrivers = new Set(dayJobs.map(job => job.driver_id).filter(Boolean)).size;
        const utilizationRate = totalDrivers > 0 ? (assignedDrivers / totalDrivers) * 100 : 0;
        
        return {
          date: format(day, 'MMM dd'),
          fullDate: dayString,
          assigned_drivers: assignedDrivers,
          total_drivers: totalDrivers,
          utilization_rate: utilizationRate,
          jobs_count: dayJobs.length
        };
      });

      // Calculate summary metrics
      const avgUtilization = chartData.reduce((sum, day) => sum + day.utilization_rate, 0) / chartData.length;
      const peakUtilization = Math.max(...chartData.map(day => day.utilization_rate));
      const totalJobsAssigned = chartData.reduce((sum, day) => sum + day.jobs_count, 0);

      return {
        chartData,
        summary: {
          avgUtilization,
          peakUtilization,
          totalJobsAssigned,
          totalDrivers
        }
      };
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          Driver Utilization
        </h3>
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500">Loading utilization data...</div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-orange-600">
            Utilization: {data.utilization_rate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            {data.assigned_drivers} of {data.total_drivers} drivers assigned
          </p>
          <p className="text-sm text-gray-600">
            {data.jobs_count} jobs scheduled
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-orange-600" />
        Driver Utilization
      </h3>
      <p className="text-sm text-gray-600 mb-4">Daily driver assignment rates and workload distribution</p>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-orange text-white p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Avg. Utilization</span>
          </div>
          <p className="text-lg font-bold">{utilizationData?.summary.avgUtilization.toFixed(1)}%</p>
        </div>
        
        <div className="bg-gradient-blue text-white p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Total Drivers</span>
          </div>
          <p className="text-lg font-bold">{utilizationData?.summary.totalDrivers}</p>
        </div>
        
        <div className="bg-gradient-purple text-white p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Peak Utilization</span>
          </div>
          <p className="text-lg font-bold">{utilizationData?.summary.peakUtilization.toFixed(1)}%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {utilizationData?.chartData && utilizationData.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilizationData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                fontSize={12}
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="utilization_rate" 
                fill="url(#orangeGradient)"
                radius={[2, 2, 0, 0]}
              />
              <defs>
                <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No utilization data available</p>
              <p className="text-xs mt-1">Chart will appear once jobs are assigned to drivers</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};