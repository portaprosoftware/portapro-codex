
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ReportBuilder } from './ReportBuilder';
import { RealTimeKPIDashboard } from './RealTimeKPIDashboard';
import { BusinessIntelligence } from './BusinessIntelligence';
import { AutomatedReporting } from './AutomatedReporting';
import { AdvancedCharts } from './AdvancedCharts';
import { PerformanceMetrics } from './PerformanceMetrics';
import { 
  TrendingUp, 
  Download, 
  Filter, 
  Calendar as CalendarIcon, 
  BarChart3, 
  PieChart, 
  LineChart, 
  FileText,
  Settings,
  Bell,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// Define types for analytics data to match child components
interface KPIData {
  revenue: number;
  jobs: { total: number; completed: number; completion_rate: number };
  fleet_utilization: number;
  customer_growth: number;
}

interface PerformanceData {
  totalDrivers: number;
  averageJobTime: number;
  completionRate: number;
  topPerformers: Array<{ name: string; score: number; }>;
}

interface BusinessData {
  monthlyRevenue: number;
  revenueGrowth: number;
  averageJobValue: number;
  collectionRate: number;
}

export const AdvancedAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'jobs', 'efficiency']);
  const [reportBuilderOpen, setReportBuilderOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Real-time data fetching with mock data for now
  const { data: kpiData, isLoading: kpiLoading, refetch: refetchKPI } = useQuery({
    queryKey: ['advanced-kpi', dateRange],
    queryFn: async (): Promise<KPIData> => {
      // Use existing jobs and invoices tables for real data
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));

      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, status')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));

      const totalJobs = jobs?.length || 0;
      const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0;
      const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || 0;

      return {
        revenue: totalRevenue,
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          completion_rate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
        },
        fleet_utilization: Math.floor(Math.random() * 30) + 70,
        customer_growth: Math.floor(Math.random() * 20) + 5
      };
    },
    refetchInterval: refreshInterval
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance-metrics', dateRange],
    queryFn: async (): Promise<PerformanceData> => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      return {
        totalDrivers: profiles?.length || 0,
        averageJobTime: Math.floor(Math.random() * 60) + 120,
        completionRate: Math.floor(Math.random() * 15) + 85,
        topPerformers: [
          { name: 'John Doe', score: 95 },
          { name: 'Jane Smith', score: 92 },
          { name: 'Mike Johnson', score: 89 }
        ]
      };
    },
    refetchInterval: refreshInterval
  });

  const { data: businessData, isLoading: businessLoading } = useQuery({
    queryKey: ['business-intelligence', dateRange],
    queryFn: async (): Promise<BusinessData> => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, status')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));

      const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
      const monthlyRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const averageJobValue = paidInvoices.length > 0 ? monthlyRevenue / paidInvoices.length : 0;

      return {
        monthlyRevenue,
        revenueGrowth: Math.floor(Math.random() * 30) + 5,
        averageJobValue,
        collectionRate: Math.floor(Math.random() * 10) + 90
      };
    },
    refetchInterval: refreshInterval
  });

  const exportData = async (format: 'pdf' | 'excel' | 'csv') => {
    // Implementation for data export
    console.log('Exporting data in format:', format);
  };

  const quickDateRanges = [
    { label: 'Today', value: 'today', from: new Date(), to: new Date() },
    { label: 'Yesterday', value: 'yesterday', from: subDays(new Date(), 1), to: subDays(new Date(), 1) },
    { label: 'Last 7 Days', value: 'week', from: subDays(new Date(), 7), to: new Date() },
    { label: 'Last 30 Days', value: 'month', from: subDays(new Date(), 30), to: new Date() },
    { label: 'This Month', value: 'thisMonth', from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
  ];

  return (
    <div className="space-y-6">
      {/* Advanced Controls Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business intelligence and reporting</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Quick Date Range Selector */}
          <Select onValueChange={(value) => {
            const range = quickDateRanges.find(r => r.value === value);
            if (range) setDateRange({ from: range.from, to: range.to });
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Quick ranges" />
            </SelectTrigger>
            <SelectContent>
              {quickDateRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, 'MMM d') : 'Pick a date'}
                {dateRange.to && ` - ${format(dateRange.to, 'MMM d')}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => range && range.from && range.to && setDateRange({ from: range.from, to: range.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Refresh Controls */}
          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Manual</SelectItem>
              <SelectItem value="10000">10s</SelectItem>
              <SelectItem value="30000">30s</SelectItem>
              <SelectItem value="60000">1m</SelectItem>
              <SelectItem value="300000">5m</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetchKPI()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          {/* Export Options */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('excel')}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          {/* Report Builder */}
          <Button onClick={() => setReportBuilderOpen(true)} className="bg-gradient-to-r from-blue-600 to-blue-500">
            <BarChart3 className="w-4 h-4 mr-2" />
            Report Builder
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Real-time Dashboard</TabsTrigger>
          <TabsTrigger value="business">Business Intelligence</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="charts">Advanced Charts</TabsTrigger>
          <TabsTrigger value="reports">Automated Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <RealTimeKPIDashboard 
            data={kpiData}
            dateRange={dateRange}
            isLoading={kpiLoading}
            refreshInterval={refreshInterval}
          />
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <BusinessIntelligence 
            data={businessData}
            dateRange={dateRange}
            isLoading={businessLoading}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetrics 
            data={performanceData}
            dateRange={dateRange}
            isLoading={performanceLoading}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <AdvancedCharts 
            kpiData={kpiData}
            performanceData={performanceData}
            businessData={businessData}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <AutomatedReporting 
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Analytics Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Refresh Interval</label>
                  <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Manual refresh only</SelectItem>
                      <SelectItem value="10000">Every 10 seconds</SelectItem>
                      <SelectItem value="30000">Every 30 seconds</SelectItem>
                      <SelectItem value="60000">Every minute</SelectItem>
                      <SelectItem value="300000">Every 5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Metrics</label>
                  <div className="flex flex-wrap gap-2">
                    {['revenue', 'jobs', 'efficiency', 'customers', 'fleet'].map((metric) => (
                      <Badge
                        key={metric}
                        variant={selectedMetrics.includes(metric) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedMetrics(prev => 
                            prev.includes(metric)
                              ? prev.filter(m => m !== metric)
                              : [...prev, metric]
                          );
                        }}
                      >
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Builder Modal */}
      <ReportBuilder
        isOpen={reportBuilderOpen}
        onClose={() => setReportBuilderOpen(false)}
        dateRange={dateRange}
      />
    </div>
  );
};
