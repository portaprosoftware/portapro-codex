
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
          gradientFrom="#10b981"
          gradientTo="#059669"
          iconBg="#33CC66"
          subtitle={<span className="text-green-600 font-semibold">+22.1% vs last period</span>}
        />
        
        <StatCard
          title="Returning Customers"
          value={customers?.returning_customers || 0}
          icon={Users}
          gradientFrom="#3b82f6"
          gradientTo="#1d4ed8"
          iconBg="#3366FF"
          subtitle={<span className="text-green-600 font-semibold">+8.5% vs last period</span>}
        />
        
        <StatCard
          title="Retention Rate"
          value={`${(customers?.retention_rate || 0).toFixed(1)}%`}
          icon={Heart}
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          iconBg="#FF9933"
          subtitle={<span className="text-green-600 font-semibold">+4.2% vs last period</span>}
        />
        
        <StatCard
          title="Avg. CLV"
          value={`$${(customers?.avg_clv || 0).toLocaleString()}`}
          icon={DollarSign}
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          iconBg="#8B5CF6"
          subtitle={<span className="text-green-600 font-semibold">+15.8% vs last period</span>}
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
