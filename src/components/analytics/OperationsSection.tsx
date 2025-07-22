
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { KPICard } from './KPICard';
import { Truck, Package, Wrench, RotateCcw } from 'lucide-react';
import type { OperationsAnalytics } from '@/types/analytics';

interface OperationsSectionProps {
  dateRange: { from: Date; to: Date };
}

export const OperationsSection: React.FC<OperationsSectionProps> = ({ dateRange }) => {
  const { data: operations, isLoading } = useQuery({
    queryKey: ['analytics-operations', dateRange],
    queryFn: async () => {
      // Mock data until RPC functions are available
      const mockData: OperationsAnalytics = {
        deliveries: 156,
        pickups: 142,
        services: 89,
        returns: 67,
        total: 454
      };
      return mockData;
    }
  });

  return (
    <div className="space-y-8">
      {/* Operations KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Deliveries"
          value={operations?.deliveries || 0}
          change={15.3}
          icon={Truck}
          color="#3366FF"
          loading={isLoading}
        />
        
        <KPICard
          title="Pickups"
          value={operations?.pickups || 0}
          change={-2.1}
          icon={Package}
          color="#33CC66"
          loading={isLoading}
        />
        
        <KPICard
          title="Services"
          value={operations?.services || 0}
          change={8.7}
          icon={Wrench}
          color="#FF9933"
          loading={isLoading}
        />
        
        <KPICard
          title="Returns"
          value={operations?.returns || 0}
          change={5.2}
          icon={RotateCcw}
          color="#8B5CF6"
          loading={isLoading}
        />
      </div>

      {/* Operations Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Operations Trend</h3>
          <p className="text-gray-500">Stacked area chart coming soon...</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold mb-4">Workload Insights</h3>
          <p className="text-gray-500">Peak hours and utilization metrics coming soon...</p>
        </div>
      </div>
    </div>
  );
};
