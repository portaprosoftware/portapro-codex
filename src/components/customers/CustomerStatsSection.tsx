import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, FileText, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CustomerStatsSectionProps {
  customerId: string;
}

export function CustomerStatsSection({ customerId }: CustomerStatsSectionProps) {
  const navigate = useNavigate();
  
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
    if (!stats?.nextJob) return "No upcoming jobs";
    const date = new Date(stats.nextJob.scheduled_date);
    const capitalizedJobType = stats.nextJob.job_type.charAt(0).toUpperCase() + stats.nextJob.job_type.slice(1);
    return (
      <div className="flex flex-col justify-center h-full">
        <span className="text-sm font-bold text-gray-700 mb-1 leading-tight">{capitalizedJobType}</span>
        <span className="text-lg font-semibold leading-tight">{date.toLocaleDateString()}</span>
      </div>
    );
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* KPI Tiles - single column on mobile, grid on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="Total Job History"
          value={stats?.totalJobs.toString() || '0'}
          icon={Calendar}
          gradientFrom="#3B82F6"
          gradientTo="#1D4ED8"
          iconBg="#3B82F6"
          delay={0}
        />
        
        <StatCard
          title="Outstanding Balance"
          value={`$${stats?.outstandingBalance.toLocaleString() || '0'}`}
          icon={DollarSign}
          gradientFrom="#10B981"
          gradientTo="#059669"
          iconBg="#10B981"
          delay={100}
        />
        
        <StatCard
          title="Outstanding Invoices"
          value={stats?.outstandingInvoices.toString() || '0'}
          icon={FileText}
          gradientFrom="#F59E0B"
          gradientTo="#D97706"
          iconBg="#F59E0B"
          delay={200}
        />
        
        {/* Next Job Card - special styling for "No upcoming jobs" */}
        {stats?.nextJob ? (
          <StatCard
            title="Next Scheduled Job"
            value={formatNextJob()}
            icon={MapPin}
            gradientFrom="#8B5CF6"
            gradientTo="#7C3AED"
            iconBg="#8B5CF6"
            delay={300}
          />
        ) : (
          <Card className="relative overflow-hidden transition-all duration-300 ease-out bg-gradient-to-b from-[#F6F9FF] to-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-4 min-h-[140px] md:h-32">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-purple-500 to-purple-700" />
            
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900 mb-1">No upcoming jobs</div>
                <div className="text-sm text-gray-600 mb-2">Next Scheduled Job</div>
                <Button
                  size="sm"
                  onClick={() => navigate('/customer-hub')}
                  className="hidden md:inline-flex bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-xs px-3 py-1.5 h-auto"
                >
                  Schedule Job
                </Button>
              </div>
              
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 ml-3 bg-gradient-to-br from-purple-500 to-purple-700">
                <MapPin className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}