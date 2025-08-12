
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/ui/StatCard';
import { DollarSign, TrendingUp, AlertCircle, Target } from 'lucide-react';
import type { RevenueAnalytics } from '@/types/analytics';

interface RevenueSectionProps {
  dateRange: { from: Date; to: Date };
}

export const RevenueSection: React.FC<RevenueSectionProps> = ({ dateRange }) => {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['analytics-revenue', dateRange],
    queryFn: async () => {
      // Mock data until RPC functions are available
      const mockData: RevenueAnalytics = {
        invoiced: 45200,
        collected: 38650,
        outstanding: 6550,
        collection_rate: 85.5
      };
      return mockData;
    }
  });

  return (
    <div className="space-y-8">
      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Invoiced"
          value={`$${(revenue?.invoiced || 0).toLocaleString()}`}
          icon={DollarSign}
          gradientFrom="from-green-600"
          gradientTo="to-green-400"
          iconBg="#33CC66"
          subtitle="+8.2% vs last period"
        />
        
        <StatCard
          title="Collected"
          value={`$${(revenue?.collected || 0).toLocaleString()}`}
          icon={TrendingUp}
          gradientFrom="from-blue-600"
          gradientTo="to-blue-400"
          iconBg="#3366FF"
          subtitle="+12.5% vs last period"
        />
        
        <StatCard
          title="Outstanding"
          value={`$${(revenue?.outstanding || 0).toLocaleString()}`}
          icon={AlertCircle}
          gradientFrom="from-orange-600"
          gradientTo="to-orange-400"
          iconBg="#FF9933"
          subtitle="-5.3% vs last period"
        />
        
        <StatCard
          title="Collection Rate"
          value={`${(revenue?.collection_rate || 0).toFixed(1)}%`}
          icon={Target}
          gradientFrom="from-purple-600"
          gradientTo="to-purple-400"
          iconBg="#8B5CF6"
          subtitle="+3.1% vs last period"
        />
      </div>

      {/* Revenue Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <p className="text-gray-500">Interactive revenue charts coming soon...</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Aging Analysis</h3>
          <p className="text-gray-500">Payment aging breakdown coming soon...</p>
        </div>
      </div>
    </div>
  );
};
