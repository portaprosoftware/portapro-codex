
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { UserPlus, Users, Heart, DollarSign } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { CustomerAnalytics } from '@/types/analytics';
import { CohortAnalysisChart } from './CohortAnalysisChart';
import { TopCustomersChart } from './TopCustomersChart';

interface CustomersSectionProps {
  dateRange: { from: Date; to: Date };
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({ dateRange }) => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ['analytics-customers', dateRange],
    queryFn: async () => {
      // Get customer data with real calculations
      const currentPeriodStart = format(dateRange.from, 'yyyy-MM-dd');
      const currentPeriodEnd = format(dateRange.to, 'yyyy-MM-dd');
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const previousPeriodStart = format(subDays(dateRange.from, daysDiff), 'yyyy-MM-dd');
      const previousPeriodEnd = format(subDays(dateRange.to, daysDiff), 'yyyy-MM-dd');

      // Get all customers for comprehensive analysis
      const { data: allCustomers, error: allError } = await supabase
        .from('customers')
        .select(`
          id, created_at,
          jobs(id, customer_id, scheduled_date),
          invoices(id, amount, status)
        `);

      if (allError) throw allError;

      // Calculate new customers in current period
      const newCustomers = allCustomers?.filter(customer => 
        customer.created_at >= currentPeriodStart && customer.created_at <= currentPeriodEnd
      ).length || 0;

      // Calculate returning customers (customers with more than 1 job)
      const returningCustomers = allCustomers?.filter(customer => 
        customer.jobs && customer.jobs.length > 1
      ).length || 0;

      // Calculate retention rate (customers active in last 90 days)
      const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const activeCustomers = allCustomers?.filter(customer =>
        customer.jobs && customer.jobs.some(job => job.scheduled_date >= ninetyDaysAgo)
      ).length || 0;
      
      const totalCustomers = allCustomers?.length || 0;
      const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

      // Calculate average CLV based on paid invoices
      const totalRevenue = allCustomers?.reduce((sum, customer) => {
        const customerRevenue = customer.invoices?.reduce((invSum, invoice) => {
          return invSum + (invoice.status === 'paid' ? (invoice.amount || 0) : 0);
        }, 0) || 0;
        return sum + customerRevenue;
      }, 0) || 0;

      const avgClv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      const customerAnalytics: CustomerAnalytics = {
        new_customers: newCustomers,
        returning_customers: returningCustomers,
        total_customers: totalCustomers,
        retention_rate: retentionRate,
        avg_clv: avgClv
      };

      return customerAnalytics;
    }
  });

  // Calculate percentage changes (mock for now)
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

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
          subtitle={
            <span className={getChangeColor(22.1)}>
              {formatPercentage(22.1)} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Returning Customers"
          value={customers?.returning_customers || 0}
          icon={Users}
          gradientFrom="#3b82f6"
          gradientTo="#1d4ed8"
          iconBg="#3366FF"
          subtitle={
            <span className={getChangeColor(8.5)}>
              {formatPercentage(8.5)} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Retention Rate"
          value={`${(customers?.retention_rate || 0).toFixed(1)}%`}
          icon={Heart}
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          iconBg="#FF9933"
          subtitle={
            <span className={getChangeColor(4.2)}>
              {formatPercentage(4.2)} vs last period
            </span>
          }
        />
        
        <StatCard
          title="Avg. CLV"
          value={`$${Math.round(customers?.avg_clv || 0).toLocaleString()}`}
          icon={DollarSign}
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          iconBg="#8B5CF6"
          subtitle={
            <span className={getChangeColor(15.8)}>
              {formatPercentage(15.8)} vs last period
            </span>
          }
        />
      </div>

      {/* Customer Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CohortAnalysisChart dateRange={dateRange} />
        <TopCustomersChart dateRange={dateRange} />
      </div>
    </div>
  );
};
