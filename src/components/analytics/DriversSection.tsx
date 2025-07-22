
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { KPICard } from './KPICard';
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
        <KPICard
          title="Active Drivers"
          value={drivers?.active_drivers || 0}
          change={5.2}
          icon={Users}
          color="#3366FF"
          loading={isLoading}
        />
        
        <KPICard
          title="Avg. Completion"
          value={`${(drivers?.avg_completion_rate || 0).toFixed(1)}%`}
          change={3.8}
          icon={CheckCircle}
          color="#33CC66"
          loading={isLoading}
        />
        
        <KPICard
          title="Jobs Completed"
          value={drivers?.completed_jobs || 0}
          change={12.4}
          icon={Briefcase}
          color="#FF9933"
          loading={isLoading}
        />
        
        <KPICard
          title="Total Jobs"
          value={drivers?.total_jobs || 0}
          change={8.9}
          icon={Clock}
          color="#8B5CF6"
          loading={isLoading}
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
