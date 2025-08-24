
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { Truck, Package, Wrench, ClipboardList } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import { OperationsTrendChart } from './OperationsTrendChart';
import { WorkloadInsightsChart } from './WorkloadInsightsChart';
import type { OperationsAnalytics } from '@/types/analytics';

interface OperationsSectionProps {
  dateRange: { from: Date; to: Date };
}

export const OperationsSection: React.FC<OperationsSectionProps> = ({ dateRange }) => {
  const { data: operations, isLoading } = useQuery({
    queryKey: ['analytics-operations', dateRange],
    queryFn: async () => {
      // Calculate previous period for comparison
      const periodLength = differenceInDays(dateRange.to, dateRange.from);
      const previousPeriodStart = subDays(dateRange.from, periodLength + 1);
      const previousPeriodEnd = subDays(dateRange.to, periodLength + 1);

      // Fetch current period data including jobs with partial pickups
      const { data: currentJobs, error: currentError } = await supabase
        .from('jobs')
        .select('job_type, scheduled_date, partial_pickups')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (currentError) throw currentError;

      // Fetch previous period data for comparison
      const { data: previousJobs, error: previousError } = await supabase
        .from('jobs')
        .select('job_type, scheduled_date, partial_pickups')
        .gte('scheduled_date', format(previousPeriodStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(previousPeriodEnd, 'yyyy-MM-dd'));

      if (previousError) throw previousError;

      // Count current period jobs by type
      const current = {
        deliveries: currentJobs?.filter(job => job.job_type === 'delivery').length || 0,
        pickups: currentJobs?.filter(job => 
          job.job_type === 'pickup' || 
          job.job_type === 'partial-pickup' ||
          (job.partial_pickups && Object.keys(job.partial_pickups).length > 0)
        ).length || 0,
        services: currentJobs?.filter(job => job.job_type === 'service').length || 0,
        surveys: currentJobs?.filter(job => job.job_type === 'on-site-survey').length || 0,
      };

      // Count previous period jobs by type
      const previous = {
        deliveries: previousJobs?.filter(job => job.job_type === 'delivery').length || 0,
        pickups: previousJobs?.filter(job => 
          job.job_type === 'pickup' || 
          job.job_type === 'partial-pickup' ||
          (job.partial_pickups && Object.keys(job.partial_pickups).length > 0)
        ).length || 0,
        services: previousJobs?.filter(job => job.job_type === 'service').length || 0,
        surveys: previousJobs?.filter(job => job.job_type === 'on-site-survey').length || 0,
      };

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const analytics: OperationsAnalytics & { changes: any } = {
        deliveries: current.deliveries,
        pickups: current.pickups,
        services: current.services,
        surveys: current.surveys,
        total: current.deliveries + current.pickups + current.services + current.surveys,
        changes: {
          deliveries: calculateChange(current.deliveries, previous.deliveries),
          pickups: calculateChange(current.pickups, previous.pickups),
          services: calculateChange(current.services, previous.services),
          surveys: calculateChange(current.surveys, previous.surveys),
        }
      };

      return analytics;
    }
  });

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Operations KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Deliveries"
          value={operations?.deliveries || 0}
          icon={Truck}
          gradientFrom="#3b82f6"
          gradientTo="#1d4ed8"
          iconBg="#3366FF"
          subtitle={
            <span className={`font-semibold ${getChangeColor(operations?.changes?.deliveries || 0)}`}>
              {formatPercentage(operations?.changes?.deliveries || 0)} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Pickups"
          value={operations?.pickups || 0}
          icon={Package}
          gradientFrom="#10b981"
          gradientTo="#059669"
          iconBg="#33CC66"
          subtitle={
            <div className="space-y-1">
              <span className={`font-semibold ${getChangeColor(operations?.changes?.pickups || 0)}`}>
                {formatPercentage(operations?.changes?.pickups || 0)} vs last period
              </span>
              <div className="text-xs text-gray-500">Includes partial pickups</div>
            </div>
          }
        />
        
        <StatCard
          title="Services"
          value={operations?.services || 0}
          icon={Wrench}
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          iconBg="#FF9933"
          subtitle={
            <span className={`font-semibold ${getChangeColor(operations?.changes?.services || 0)}`}>
              {formatPercentage(operations?.changes?.services || 0)} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Surveys"
          value={operations?.surveys || 0}
          icon={ClipboardList}
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          iconBg="#8B5CF6"
          subtitle={
            <span className={`font-semibold ${getChangeColor(operations?.changes?.surveys || 0)}`}>
              {formatPercentage(operations?.changes?.surveys || 0)} vs last period
            </span>
          }
        />
      </div>

      {/* Operations Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Operations Trend</h3>
          <OperationsTrendChart dateRange={dateRange} />
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold mb-4">Workload Insights</h3>
          <WorkloadInsightsChart dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
};
