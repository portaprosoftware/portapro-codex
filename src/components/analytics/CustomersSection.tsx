
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from './KPICard';
import { UserPlus, Users, Heart, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface CustomersSectionProps {
  dateRange: { from: Date; to: Date };
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({ dateRange }) => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ['analytics-customers', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_customer_analytics', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-8">
      {/* Customer KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="New Customers"
          value={customers?.new_customers || 0}
          change={22.1}
          icon={UserPlus}
          color="#33CC66"
          loading={isLoading}
        />
        
        <KPICard
          title="Returning Customers"
          value={customers?.returning_customers || 0}
          change={8.5}
          icon={Users}
          color="#3366FF"
          loading={isLoading}
        />
        
        <KPICard
          title="Retention Rate"
          value={`${(customers?.retention_rate || 0).toFixed(1)}%`}
          change={4.2}
          icon={Heart}
          color="#FF9933"
          loading={isLoading}
        />
        
        <KPICard
          title="Avg. CLV"
          value={`$${(customers?.avg_clv || 0).toLocaleString()}`}
          change={15.8}
          icon={DollarSign}
          color="#8B5CF6"
          loading={isLoading}
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
