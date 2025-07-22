import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, DollarSign, FileText, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/analytics/KPICard';

interface CustomerStatsSectionProps {
  customerId: string;
}

export function CustomerStatsSection({ customerId }: CustomerStatsSectionProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['customer-stats', customerId],
    queryFn: async () => {
      // Get total jobs count
      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      // Get outstanding balance from unpaid invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('status', 'unpaid');

      const outstandingBalance = invoices?.reduce((sum, invoice) => sum + Number(invoice.amount), 0) || 0;

      // Get outstanding invoices count
      const { count: outstandingInvoices } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('status', 'unpaid');

      // Get next scheduled job
      const { data: nextJob } = await supabase
        .from('jobs')
        .select('scheduled_date, job_type')
        .eq('customer_id', customerId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single();

      return {
        totalJobs: totalJobs || 0,
        outstandingBalance,
        outstandingInvoices: outstandingInvoices || 0,
        nextJob,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const formatNextJob = () => {
    if (!stats?.nextJob) return 'No upcoming jobs';
    const date = new Date(stats.nextJob.scheduled_date);
    return `${stats.nextJob.job_type} - ${date.toLocaleDateString()}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <KPICard
        title="Total Job History"
        value={stats?.totalJobs.toString() || '0'}
        icon={Calendar}
        color="#3B82F6"
      />
      
      <KPICard
        title="Outstanding Balance"
        value={`$${stats?.outstandingBalance.toLocaleString() || '0'}`}
        icon={DollarSign}
        color="#10B981"
        change={stats?.outstandingBalance > 0 ? -5 : 0}
      />
      
      <KPICard
        title="Outstanding Invoices"
        value={stats?.outstandingInvoices.toString() || '0'}
        icon={FileText}
        color="#F59E0B"
      />
      
      <KPICard
        title="Next Scheduled Job"
        value={formatNextJob()}
        icon={MapPin}
        color="#8B5CF6"
      />
    </div>
  );
}