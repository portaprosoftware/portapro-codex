
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { RevenueTrendChart } from './RevenueTrendChart';
import { AgingAnalysisChart } from './AgingAnalysisChart';
import { DollarSign, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import type { RevenueAnalytics } from '@/types/analytics';

interface RevenueSectionProps {
  dateRange: { from: Date; to: Date };
}

export const RevenueSection: React.FC<RevenueSectionProps> = ({ dateRange }) => {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['analytics-revenue', dateRange],
    queryFn: async () => {
      // Fetch real invoice data for revenue analytics
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount, status, created_at, due_date')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));

      if (invoicesError) throw invoicesError;

      // Calculate revenue metrics from real data
      const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const totalCollected = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const totalOutstanding = invoices?.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

      return {
        invoiced: totalInvoiced,
        collected: totalCollected,
        outstanding: totalOutstanding,
        collection_rate: collectionRate
      } as RevenueAnalytics;
    }
  });

  const { data: trendData } = useQuery({
    queryKey: ['revenue-trend', dateRange],
    queryFn: async () => {
      // Fetch daily revenue data for trend chart
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('amount, status, created_at, due_date')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'))
        .order('created_at');

      if (error) throw error;

      // Group by date
      const dailyData: { [key: string]: any } = {};
      
      invoices?.forEach(invoice => {
        const date = invoice.created_at.split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            invoiced: 0,
            collected: 0,
            outstanding: 0
          };
        }
        
        dailyData[date].invoiced += invoice.amount || 0;
        if (invoice.status === 'paid') {
          dailyData[date].collected += invoice.amount || 0;
        } else if (invoice.status === 'unpaid') {
          dailyData[date].outstanding += invoice.amount || 0;
        }
      });

      return Object.values(dailyData).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }
  });

  const { data: agingData } = useQuery({
    queryKey: ['aging-analysis', dateRange],
    queryFn: async () => {
      // Fetch unpaid invoices for aging analysis
      const { data: unpaidInvoices, error } = await supabase
        .from('invoices')
        .select('amount, due_date, created_at')
        .eq('status', 'unpaid')
        .order('due_date');

      if (error) throw error;

      const today = new Date();
      const agingBuckets = {
        'Current': { amount: 0, count: 0, color: '#10b981' },
        '1-30 Days': { amount: 0, count: 0, color: '#f59e0b' },
        '31-60 Days': { amount: 0, count: 0, color: '#ef4444' },
        '61-90 Days': { amount: 0, count: 0, color: '#dc2626' },
        '90+ Days': { amount: 0, count: 0, color: '#991b1b' }
      };

      unpaidInvoices?.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = differenceInDays(today, dueDate);
        const amount = invoice.amount || 0;

        if (daysOverdue <= 0) {
          agingBuckets['Current'].amount += amount;
          agingBuckets['Current'].count += 1;
        } else if (daysOverdue <= 30) {
          agingBuckets['1-30 Days'].amount += amount;
          agingBuckets['1-30 Days'].count += 1;
        } else if (daysOverdue <= 60) {
          agingBuckets['31-60 Days'].amount += amount;
          agingBuckets['31-60 Days'].count += 1;
        } else if (daysOverdue <= 90) {
          agingBuckets['61-90 Days'].amount += amount;
          agingBuckets['61-90 Days'].count += 1;
        } else {
          agingBuckets['90+ Days'].amount += amount;
          agingBuckets['90+ Days'].count += 1;
        }
      });

      return Object.entries(agingBuckets).map(([range, data]) => ({
        range,
        amount: data.amount,
        count: data.count,
        color: data.color
      }));
    }
  });

  // Calculate previous period for comparison
  const { data: previousPeriod } = useQuery({
    queryKey: ['revenue-comparison', dateRange],
    queryFn: async () => {
      const periodLength = differenceInDays(dateRange.to, dateRange.from);
      const previousStart = subDays(dateRange.from, periodLength);
      const previousEnd = subDays(dateRange.to, periodLength);

      const { data: prevInvoices, error } = await supabase
        .from('invoices')
        .select('amount, status')
        .gte('created_at', format(previousStart, 'yyyy-MM-dd'))
        .lte('created_at', format(previousEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const prevInvoiced = prevInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const prevCollected = prevInvoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const prevOutstanding = prevInvoices?.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const prevCollectionRate = prevInvoiced > 0 ? (prevCollected / prevInvoiced) * 100 : 0;

      return {
        invoiced: prevInvoiced,
        collected: prevCollected,
        outstanding: prevOutstanding,
        collection_rate: prevCollectionRate
      };
    }
  });

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const invoicedChange = calculateChange(revenue?.invoiced || 0, previousPeriod?.invoiced || 0);
  const collectedChange = calculateChange(revenue?.collected || 0, previousPeriod?.collected || 0);
  const outstandingChange = calculateChange(revenue?.outstanding || 0, previousPeriod?.outstanding || 0);
  const collectionRateChange = calculateChange(revenue?.collection_rate || 0, previousPeriod?.collection_rate || 0);

  return (
    <div className="space-y-8">
      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Invoiced"
          value={`$${(revenue?.invoiced || 0).toLocaleString()}`}
          icon={DollarSign}
          gradientFrom="#10b981"
          gradientTo="#059669"
          iconBg="#33CC66"
          subtitle={
            <span className={`font-semibold ${invoicedChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {invoicedChange >= 0 ? '+' : ''}{invoicedChange.toFixed(1)}% vs last period
            </span>
          }
        />
        
        <StatCard
          title="Collected"
          value={`$${(revenue?.collected || 0).toLocaleString()}`}
          icon={TrendingUp}
          gradientFrom="#3b82f6"
          gradientTo="#1d4ed8"
          iconBg="#3366FF"
          subtitle={
            <span className={`font-semibold ${collectedChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {collectedChange >= 0 ? '+' : ''}{collectedChange.toFixed(1)}% vs last period
            </span>
          }
        />
        
        <StatCard
          title="Outstanding"
          value={`$${(revenue?.outstanding || 0).toLocaleString()}`}
          icon={AlertCircle}
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          iconBg="#FF9933"
          subtitle={
            <span className={`font-semibold ${outstandingChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {outstandingChange >= 0 ? '+' : ''}{outstandingChange.toFixed(1)}% vs last period
            </span>
          }
        />
        
        <StatCard
          title="Collection Rate"
          value={`${(revenue?.collection_rate || 0).toFixed(1)}%`}
          icon={Target}
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          iconBg="#8B5CF6"
          subtitle={
            <span className={`font-semibold ${collectionRateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {collectionRateChange >= 0 ? '+' : ''}{collectionRateChange.toFixed(1)}% vs last period
            </span>
          }
        />
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart
          data={trendData || []}
          title="Revenue Trend"
          height={300}
        />
        
        <AgingAnalysisChart
          data={agingData || []}
          title="Aging Analysis"
          height={300}
        />
      </div>
    </div>
  );
};
