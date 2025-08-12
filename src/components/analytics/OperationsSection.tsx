
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/ui/StatCard';
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
        <StatCard
          title="Deliveries"
          value={operations?.deliveries || 0}
          icon={Truck}
          gradientFrom="from-blue-600"
          gradientTo="to-blue-400"
          iconBg="#3366FF"
          subtitle="+15.3% vs last period"
        />
        
        <StatCard
          title="Pickups"
          value={operations?.pickups || 0}
          icon={Package}
          gradientFrom="from-green-600"
          gradientTo="to-green-400"
          iconBg="#33CC66"
          subtitle="-2.1% vs last period"
        />
        
        <StatCard
          title="Services"
          value={operations?.services || 0}
          icon={Wrench}
          gradientFrom="from-orange-600"
          gradientTo="to-orange-400"
          iconBg="#FF9933"
          subtitle="+8.7% vs last period"
        />
        
        <StatCard
          title="Returns"
          value={operations?.returns || 0}
          icon={RotateCcw}
          gradientFrom="from-purple-600"
          gradientTo="to-purple-400"
          iconBg="#8B5CF6"
          subtitle="+5.2% vs last period"
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
