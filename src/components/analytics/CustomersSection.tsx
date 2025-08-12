
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/ui/StatCard';
import { UserPlus, Users, Heart, DollarSign } from 'lucide-react';
import type { CustomerAnalytics } from '@/types/analytics';

interface CustomersSectionProps {
  dateRange: { from: Date; to: Date };
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({ dateRange }) => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ['analytics-customers', dateRange],
    queryFn: async () => {
      // Mock data until RPC functions are available
      const mockData: CustomerAnalytics = {
        new_customers: 23,
        returning_customers: 156,
        total_customers: 179,
        retention_rate: 87.2,
        avg_clv: 4250
      };
      return mockData;
    }
  });

  return (
    <div className="space-y-8">
      {/* Customer KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="New Customers"
          value={customers?.new_customers || 0}
          icon={UserPlus}
          gradientFrom="from-green-600"
          gradientTo="to-green-400"
          iconBg="#33CC66"
          subtitle="+22.1% vs last period"
        />
        
        <StatCard
          title="Returning Customers"
          value={customers?.returning_customers || 0}
          icon={Users}
          gradientFrom="from-blue-600"
          gradientTo="to-blue-400"
          iconBg="#3366FF"
          subtitle="+8.5% vs last period"
        />
        
        <StatCard
          title="Retention Rate"
          value={`${(customers?.retention_rate || 0).toFixed(1)}%`}
          icon={Heart}
          gradientFrom="from-orange-600"
          gradientTo="to-orange-400"
          iconBg="#FF9933"
          subtitle="+4.2% vs last period"
        />
        
        <StatCard
          title="Avg. CLV"
          value={`$${(customers?.avg_clv || 0).toLocaleString()}`}
          icon={DollarSign}
          gradientFrom="from-purple-600"
          gradientTo="to-purple-400"
          iconBg="#8B5CF6"
          subtitle="+15.8% vs last period"
        />
      </div>

      {/* Customer Analysis Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-4">Cohort Analysis</h3>
          <p className="text-gray-500">30/60/90-day retention table coming soon...</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <p className="text-gray-500">High-value customer list coming soon...</p>
        </div>
      </div>
    </div>
  );
};
