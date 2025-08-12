
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from './TrendChart';
import { DonutChart } from './DonutChart';
import { ActivityFeed } from './ActivityFeed';
import { Briefcase, DollarSign, Truck, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { AnalyticsOverview } from '@/types/analytics';

interface OverviewSectionProps {
  dateRange: { from: Date; to: Date };
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ dateRange }) => {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview', dateRange],
    queryFn: async () => {
      // Since the RPC functions don't exist yet, let's return mock data
      const mockData: AnalyticsOverview = {
        jobs: {
          total: 84,
          completed: 67,
          completion_rate: 79.8
        },
        revenue: 37850,
        fleet_utilization: 72.5,
        customer_growth: 12.3
      };
      return mockData;
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
      return data || [];
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
        <StatCard
          title="Job Summary"
          value={`${overview?.jobs?.total || 0}`}
          subtitle={
            <div>
              <div>{overview?.jobs?.completed || 0} completed</div>
              <div className="text-green-600 font-semibold">+12.5% vs last period</div>
            </div>
          }
          icon={Briefcase}
          gradientFrom="#3b82f6"
          gradientTo="#1d4ed8"
          iconBg="#3366FF"
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
        
        <StatCard
          title="Revenue"
          value={`$${(overview?.revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          gradientFrom="#10b981"
          gradientTo="#059669"
          iconBg="#33CC66"
          subtitle={<span className="text-green-600 font-semibold">+12.5% vs last period</span>}
        />
        
        <StatCard
          title="Fleet Utilization"
          value={`${(overview?.fleet_utilization || 0).toFixed(1)}%`}
          icon={Truck}
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          iconBg="#FF9933"
          subtitle={<span className="text-red-600 font-semibold">-2.1% vs last period</span>}
        />
        
        <StatCard
          title="Customer Growth"
          value={`+${(overview?.customer_growth || 0).toFixed(1)}%`}
          icon={TrendingUp}
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          iconBg="#8B5CF6"
          subtitle={<span className="text-green-600 font-semibold">+123.3% vs last period</span>}
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
