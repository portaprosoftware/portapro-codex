import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, subDays } from 'date-fns';
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

interface OperationsTrendChartProps {
  dateRange: { from: Date; to: Date };
}

export const OperationsTrendChart: React.FC<OperationsTrendChartProps> = ({ dateRange }) => {
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['operations-trend', dateRange],
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('job_type, scheduled_date, created_at, partial_pickups')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('scheduled_date');

      if (error) throw error;

      // Create date range array
      const dates = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
      });

      // Group jobs by date and type
      const dailyData = dates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayJobs = jobs?.filter(job => 
          format(new Date(job.scheduled_date), 'yyyy-MM-dd') === dateStr
        ) || [];

        return {
          date: format(date, 'MMM dd'),
          fullDate: dateStr,
          deliveries: dayJobs.filter(job => job.job_type === 'delivery').length,
          pickups: dayJobs.filter(job => 
            job.job_type === 'pickup' || 
            job.job_type === 'partial-pickup' ||
            (job.partial_pickups && Object.keys(job.partial_pickups).length > 0)
          ).length,
          services: dayJobs.filter(job => job.job_type === 'service').length,
          surveys: dayJobs.filter(job => job.job_type === 'on-site-survey').length,
        };
      });

      return dailyData;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading trend data...</div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            labelStyle={{ color: '#374151' }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar
            dataKey="deliveries"
            fill="#3b82f6"
            name="Deliveries"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="pickups"
            fill="#10b981"
            name="Pickups"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="services"
            fill="#f59e0b"
            name="Services"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="surveys"
            fill="#8b5cf6"
            name="Surveys"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};