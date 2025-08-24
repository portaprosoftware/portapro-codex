import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, subMonths } from 'date-fns';

interface CohortAnalysisChartProps {
  dateRange: { from: Date; to: Date };
}

export const CohortAnalysisChart: React.FC<CohortAnalysisChartProps> = ({ dateRange }) => {
  const { data: cohortData, isLoading } = useQuery({
    queryKey: ['cohort-analysis', dateRange],
    queryFn: async () => {
      // Get cohort data for the last 6 months
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          id,
          created_at,
          jobs(id, scheduled_date, customer_id)
        `)
        .gte('created_at', format(subMonths(new Date(), 6), 'yyyy-MM-dd'))
        .order('created_at');

      if (error) throw error;

      // Group customers by their acquisition month
      const cohorts: { [key: string]: any } = {};
      
      customers?.forEach(customer => {
        const cohortMonth = format(startOfMonth(new Date(customer.created_at)), 'MMM yyyy');
        
        if (!cohorts[cohortMonth]) {
          cohorts[cohortMonth] = {
            cohortMonth,
            totalCustomers: 0,
            retention30: 0,
            retention60: 0,
            retention90: 0
          };
        }
        
        cohorts[cohortMonth].totalCustomers++;
        
        // Check retention periods
        const customerCreated = new Date(customer.created_at);
        const thirtyDaysLater = new Date(customerCreated.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysLater = new Date(customerCreated.getTime() + 60 * 24 * 60 * 60 * 1000);
        const ninetyDaysLater = new Date(customerCreated.getTime() + 90 * 24 * 60 * 60 * 1000);
        
        const hasActivityAfter30 = customer.jobs?.some(job => 
          new Date(job.scheduled_date) >= thirtyDaysLater
        );
        const hasActivityAfter60 = customer.jobs?.some(job => 
          new Date(job.scheduled_date) >= sixtyDaysLater
        );
        const hasActivityAfter90 = customer.jobs?.some(job => 
          new Date(job.scheduled_date) >= ninetyDaysLater
        );
        
        if (hasActivityAfter30) cohorts[cohortMonth].retention30++;
        if (hasActivityAfter60) cohorts[cohortMonth].retention60++;
        if (hasActivityAfter90) cohorts[cohortMonth].retention90++;
      });

      return Object.values(cohorts).reverse(); // Most recent first
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
        <h3 className="text-lg font-semibold mb-4">Cohort Analysis</h3>
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500">Loading cohort data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
      <h3 className="text-lg font-semibold mb-4">Cohort Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">Customer retention by acquisition month</p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-700">Cohort</th>
              <th className="text-center py-2 px-3 font-medium text-gray-700">Size</th>
              <th className="text-center py-2 px-3 font-medium text-gray-700">30d</th>
              <th className="text-center py-2 px-3 font-medium text-gray-700">60d</th>
              <th className="text-center py-2 px-3 font-medium text-gray-700">90d</th>
            </tr>
          </thead>
          <tbody>
            {cohortData?.map((cohort: any) => (
              <tr key={cohort.cohortMonth} className="border-b border-gray-100">
                <td className="py-2 px-3 font-medium text-gray-900">{cohort.cohortMonth}</td>
                <td className="text-center py-2 px-3">{cohort.totalCustomers}</td>
                <td className="text-center py-2 px-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-green text-white">
                    {cohort.totalCustomers > 0 ? Math.round((cohort.retention30 / cohort.totalCustomers) * 100) : 0}%
                  </span>
                </td>
                <td className="text-center py-2 px-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-blue text-white">
                    {cohort.totalCustomers > 0 ? Math.round((cohort.retention60 / cohort.totalCustomers) * 100) : 0}%
                  </span>
                </td>
                <td className="text-center py-2 px-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-purple text-white">
                    {cohort.totalCustomers > 0 ? Math.round((cohort.retention90 / cohort.totalCustomers) * 100) : 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {(!cohortData || cohortData.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No cohort data available for the selected period</p>
            <p className="text-xs mt-1">Data will appear once you have customers over multiple months</p>
          </div>
        )}
      </div>
    </div>
  );
};