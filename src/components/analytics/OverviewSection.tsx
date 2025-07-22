
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from './KPICard';
import { TrendChart } from './TrendChart';
import { DonutChart } from './DonutChart';
import { ActivityFeed } from './ActivityFeed';
import { Briefcase, DollarSign, Truck, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface OverviewSectionProps {
  dateRange: { from: Date; to: Date };
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ dateRange }) => {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_overview', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: jobTrends } = useQuery({
    queryKey: ['job-trends', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('scheduled_date, job_type, status')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('scheduled_date');
      
      if (error) throw error;
      return data;
    }
  });

  // Process job trends data for charts
  const processJobTrends = () => {
    if (!jobTrends) return [];
    
    const dailyData: { [key: string]: any } = {};
    
    jobTrends.forEach(job => {
      const date = job.scheduled_date;
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          delivery: 0,
          pickup: 0,
          service: 0,
          return: 0
        };
      }
      dailyData[date][job.job_type] = (dailyData[date][job.job_type] || 0) + 1;
    });
    
    return Object.values(dailyData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const processStatusDistribution = () => {
    if (!jobTrends) return [];
    
    const statusCounts: { [key: string]: number } = {};
    jobTrends.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: getStatusColor(status)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#33CC66';
      case 'assigned': return '#3366FF';
      case 'in_progress': return '#FF9933';
      case 'cancelled': return '#E53E3E';
      default: return '#6B7280';
    }
  };

  const trendData = processJobTrends();
  const statusData = processStatusDistribution();

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Job Summary"
          value={`${overview?.jobs?.total || 0} total`}
          subtitle={`${overview?.jobs?.completed || 0} completed`}
          icon={Briefcase}
          color="#3366FF"
          loading={isLoading}
          chart={
            <div className="h-12 flex items-end space-x-1">
              {[65, 45, 78, 52, 90, 65, 88].map((height, i) => (
                <div
                  key={i}
                  className="bg-blue-200 rounded-sm flex-1"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          }
        />
        
        <KPICard
          title="Revenue"
          value={`$${(overview?.revenue || 0).toLocaleString()}`}
          change={12.5}
          icon={DollarSign}
          color="#33CC66"
          loading={isLoading}
        />
        
        <KPICard
          title="Fleet Utilization"
          value={`${(overview?.fleet_utilization || 0).toFixed(1)}%`}
          change={-2.1}
          icon={Truck}
          color="#FF9933"
          loading={isLoading}
        />
        
        <KPICard
          title="Customer Growth"
          value={`${(overview?.customer_growth || 0) >= 0 ? '+' : ''}${(overview?.customer_growth || 0).toFixed(1)}%`}
          icon={TrendingUp}
          color="#8B5CF6"
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Volume Trend */}
        <div className="lg:col-span-2">
          <TrendChart 
            data={trendData}
            title="Job Volume Over Time"
            height={300}
          />
        </div>
        
        {/* Status Distribution */}
        <div>
          <DonutChart
            data={statusData}
            title="Job Status Distribution"
            height={300}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Placeholder for additional charts */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-gray-300">
            <h3 className="text-lg font-semibold mb-4">Additional Insights</h3>
            <p className="text-gray-500">More detailed analytics coming soon...</p>
          </div>
        </div>
        
        <div>
          <ActivityFeed dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
};
