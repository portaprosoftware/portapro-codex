import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Crown, TrendingUp, Calendar } from 'lucide-react';

interface TopCustomersChartProps {
  dateRange: { from: Date; to: Date };
}

export const TopCustomersChart: React.FC<TopCustomersChartProps> = ({ dateRange }) => {
  const { data: topCustomers, isLoading } = useQuery({
    queryKey: ['top-customers', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          created_at,
          jobs(id, scheduled_date, job_type),
          invoices(id, amount, status)
        `)
        .order('created_at');

      if (error) throw error;

      // Calculate customer metrics
      const customerMetrics = data?.map(customer => {
        const totalJobs = customer.jobs?.length || 0;
        const totalRevenue = customer.invoices?.reduce((sum, invoice) => {
          return sum + (invoice.status === 'paid' ? (invoice.amount || 0) : 0);
        }, 0) || 0;
        
        const lastJobDate = customer.jobs?.length > 0 
          ? Math.max(...customer.jobs.map(job => new Date(job.scheduled_date).getTime()))
          : new Date(customer.created_at).getTime();

        const daysSinceLastJob = Math.floor((Date.now() - lastJobDate) / (1000 * 60 * 60 * 24));

        return {
          id: customer.id,
          name: customer.name,
          totalJobs,
          totalRevenue,
          avgJobValue: totalJobs > 0 ? totalRevenue / totalJobs : 0,
          daysSinceLastJob,
          lastJobDate: new Date(lastJobDate),
          joinDate: new Date(customer.created_at)
        };
      }) || [];

      // Sort by total revenue and total jobs
      return customerMetrics
        .sort((a, b) => {
          // Primary sort: total revenue
          if (b.totalRevenue !== a.totalRevenue) {
            return b.totalRevenue - a.totalRevenue;
          }
          // Secondary sort: total jobs
          return b.totalJobs - a.totalJobs;
        })
        .slice(0, 8); // Top 8 customers
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
        <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500">Loading customer data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-purple-600" />
        Top Customers
      </h3>
      <p className="text-sm text-gray-600 mb-4">Ranked by revenue and job volume</p>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {topCustomers?.map((customer: any, index: number) => (
          <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-800' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {format(customer.joinDate, 'MMM yyyy')}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {customer.totalRevenue > 0 ? `$${customer.totalRevenue.toLocaleString()}` : '$0'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {customer.totalJobs} jobs
                  </p>
                </div>
              </div>
              
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  customer.daysSinceLastJob <= 7 ? 'bg-green-100 text-green-800' :
                  customer.daysSinceLastJob <= 30 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {customer.daysSinceLastJob <= 7 ? 'Active' :
                   customer.daysSinceLastJob <= 30 ? 'Recent' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {(!topCustomers || topCustomers.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No customer data available</p>
            <p className="text-xs mt-1">Customer rankings will appear once you have active customers</p>
          </div>
        )}
      </div>
    </div>
  );
};