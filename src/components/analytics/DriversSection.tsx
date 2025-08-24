
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { Users, CheckCircle, Clock, Briefcase } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import { DriverPerformanceChart } from './DriverPerformanceChart';
import { DriverUtilizationChart } from './DriverUtilizationChart';

interface DriversSectionProps {
  dateRange: { from: Date; to: Date };
}

export const DriversSection: React.FC<DriversSectionProps> = ({ dateRange }) => {
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['analytics-drivers', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          driver_id,
          status,
          scheduled_date,
          actual_completion_time,
          created_at
        `)
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (error) throw error;

      // Get all drivers from user_roles table
      const { data: allDrivers, error: driversError } = await supabase
        .from('user_roles')
        .select('user_id, clerk_user_id')
        .eq('role', 'driver');

      if (driversError) throw driversError;

      // Calculate metrics
      const totalJobs = data?.length || 0;
      const completedJobs = data?.filter(job => job.status === 'completed').length || 0;
      const activeDrivers = new Set(data?.map(job => job.driver_id).filter(Boolean)).size;
      const avgCompletionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      // Calculate previous period for comparison
      const daysDiff = differenceInDays(dateRange.to, dateRange.from);
      const previousStart = subDays(dateRange.from, daysDiff);
      const previousEnd = subDays(dateRange.to, daysDiff);

      const { data: previousData } = await supabase
        .from('jobs')
        .select('id, driver_id, status')
        .gte('scheduled_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(previousEnd, 'yyyy-MM-dd'));

      const previousTotalJobs = previousData?.length || 0;
      const previousCompletedJobs = previousData?.filter(job => job.status === 'completed').length || 0;
      const previousActiveDrivers = new Set(previousData?.map(job => job.driver_id).filter(Boolean)).size;
      const previousCompletionRate = previousTotalJobs > 0 ? (previousCompletedJobs / previousTotalJobs) * 100 : 0;

      return {
        active_drivers: activeDrivers,
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        avg_completion_rate: avgCompletionRate,
        previous_period: {
          active_drivers: previousActiveDrivers,
          total_jobs: previousTotalJobs,
          completed_jobs: previousCompletedJobs,
          avg_completion_rate: previousCompletionRate
        }
      };
    }
  });

  // Helper functions for percentage changes
  const getPercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number): string => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Driver KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Drivers"
          value={drivers?.active_drivers || 0}
          icon={Users}
          gradientFrom="#3b82f6"
          gradientTo="#1d4ed8"
          iconBg="#3366FF"
          subtitle={
            <span className={`font-semibold ${getChangeColor(getPercentageChange(drivers?.active_drivers || 0, drivers?.previous_period?.active_drivers || 0))}`}>
              {formatPercentage(getPercentageChange(drivers?.active_drivers || 0, drivers?.previous_period?.active_drivers || 0))} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Avg. Completion"
          value={`${(drivers?.avg_completion_rate || 0).toFixed(1)}%`}
          icon={CheckCircle}
          gradientFrom="#10b981"
          gradientTo="#059669"
          iconBg="#33CC66"
          subtitle={
            <span className={`font-semibold ${getChangeColor(getPercentageChange(drivers?.avg_completion_rate || 0, drivers?.previous_period?.avg_completion_rate || 0))}`}>
              {formatPercentage(getPercentageChange(drivers?.avg_completion_rate || 0, drivers?.previous_period?.avg_completion_rate || 0))} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Jobs Completed"
          value={drivers?.completed_jobs || 0}
          icon={Briefcase}
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          iconBg="#FF9933"
          subtitle={
            <span className={`font-semibold ${getChangeColor(getPercentageChange(drivers?.completed_jobs || 0, drivers?.previous_period?.completed_jobs || 0))}`}>
              {formatPercentage(getPercentageChange(drivers?.completed_jobs || 0, drivers?.previous_period?.completed_jobs || 0))} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Total Jobs"
          value={drivers?.total_jobs || 0}
          icon={Clock}
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          iconBg="#8B5CF6"
          subtitle={
            <span className={`font-semibold ${getChangeColor(getPercentageChange(drivers?.total_jobs || 0, drivers?.previous_period?.total_jobs || 0))}`}>
              {formatPercentage(getPercentageChange(drivers?.total_jobs || 0, drivers?.previous_period?.total_jobs || 0))} vs last period
            </span>
          }
        />
      </div>

      {/* Driver Performance and Utilization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DriverPerformanceChart dateRange={dateRange} />
        <DriverUtilizationChart dateRange={dateRange} />
      </div>
    </div>
  );
};
