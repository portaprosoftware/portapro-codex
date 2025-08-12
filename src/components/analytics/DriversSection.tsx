
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/ui/StatCard';
import { Users, CheckCircle, Clock, Briefcase } from 'lucide-react';
import type { DriverAnalytics } from '@/types/analytics';

interface DriversSectionProps {
  dateRange: { from: Date; to: Date };
}

export const DriversSection: React.FC<DriversSectionProps> = ({ dateRange }) => {
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['analytics-drivers', dateRange],
    queryFn: async () => {
      // Mock data until RPC functions are available
      const mockData: DriverAnalytics = {
        active_drivers: 12,
        total_jobs: 342,
        completed_jobs: 289,
        avg_completion_rate: 84.5
      };
      return mockData;
    }
  });

  return (
    <div className="space-y-8">
      {/* Driver KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Drivers"
          value={drivers?.active_drivers || 0}
          icon={Users}
          gradientFrom="from-blue-600"
          gradientTo="to-blue-400"
          iconBg="#3366FF"
          subtitle="+5.2% vs last period"
        />
        
        <StatCard
          title="Avg. Completion"
          value={`${(drivers?.avg_completion_rate || 0).toFixed(1)}%`}
          icon={CheckCircle}
          gradientFrom="from-green-600"
          gradientTo="to-green-400"
          iconBg="#33CC66"
          subtitle="+3.8% vs last period"
        />
        
        <StatCard
          title="Jobs Completed"
          value={drivers?.completed_jobs || 0}
          icon={Briefcase}
          gradientFrom="from-orange-600"
          gradientTo="to-orange-400"
          iconBg="#FF9933"
          subtitle="+12.4% vs last period"
        />
        
        <StatCard
          title="Total Jobs"
          value={drivers?.total_jobs || 0}
          icon={Clock}
          gradientFrom="from-purple-600"
          gradientTo="to-purple-400"
          iconBg="#8B5CF6"
          subtitle="+8.9% vs last period"
        />
      </div>

      {/* Driver Performance Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Driver Performance</h3>
          <p className="text-gray-500">Driver table with performance metrics coming soon...</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold mb-4">Utilization Chart</h3>
          <p className="text-gray-500">Driver utilization comparison coming soon...</p>
        </div>
      </div>
    </div>
  );
};
