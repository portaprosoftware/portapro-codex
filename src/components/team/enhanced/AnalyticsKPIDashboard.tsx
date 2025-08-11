import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  BarChart3, Clock, CheckCircle, TrendingUp, Download, Filter, 
  Users, Calendar, AlertTriangle, DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface KPIData {
  totalHours: number;
  hoursChange: number;
  jobsCompleted: number;
  jobsChange: number;
  onTimeRate: number;
  onTimeChange: number;
  activeTeamMembers: number;
  teamChange: number;
}

export function AnalyticsKPIDashboard() {
  const [dateRange, setDateRange] = useState('30d');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['team-analytics-kpi', dateRange, roleFilter],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();

      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
      startDate.setDate(endDate.getDate() - days);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Jobs in period
      const { data: jobs = [] } = await supabase
        .from('jobs')
        .select('id,status,scheduled_date,completed_at,scheduled_time')
        .gte('scheduled_date', startStr)
        .lte('scheduled_date', endStr);

      const completedJobs = jobs.filter((j: any) => j.status === 'completed');
      const onTimeJobs = completedJobs.filter((j: any) => {
        if (!j.completed_at || !j.scheduled_date) return false;
        const scheduled = new Date(`${j.scheduled_date}T${j.scheduled_time || '23:59'}`);
        const completed = new Date(j.completed_at);
        return completed <= scheduled;
      });

      // Active team members by role
      let rolesQuery = supabase
        .from('user_roles')
        .select('user_id, role');
      if (roleFilter !== 'all') {
        rolesQuery = rolesQuery.eq('role', roleFilter as any);
      } else {
        rolesQuery = rolesQuery.in('role', ['driver', 'dispatch', 'admin']);
      }
      const { data: roles = [] } = await rolesQuery;
      const activeTeamMembers = new Set((roles as any[]).map(r => r.user_id)).size;

      // Daily vehicle assignments used as proxy for hours
      const { data: assignments = [] } = await supabase
        .from('daily_vehicle_assignments')
        .select('id')
        .gte('assignment_date', startStr)
        .lte('assignment_date', endStr);

      const totalHours = (assignments?.length || 0) * 8;

      // Previous period for change calculations
      const prevEnd = new Date(startDate);
      const prevStart = new Date(startDate);
      prevStart.setDate(prevStart.getDate() - days);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const { data: prevJobs = [] } = await supabase
        .from('jobs')
        .select('id,status,scheduled_date,completed_at,scheduled_time')
        .gte('scheduled_date', prevStartStr)
        .lte('scheduled_date', prevEndStr);

      const { data: prevAssignments = [] } = await supabase
        .from('daily_vehicle_assignments')
        .select('id')
        .gte('assignment_date', prevStartStr)
        .lte('assignment_date', prevEndStr);

      const prevCompleted = (prevJobs as any[]).filter(j => j.status === 'completed');
      const prevOnTime = prevCompleted.filter((j: any) => {
        if (!j.completed_at || !j.scheduled_date) return false;
        const scheduled = new Date(`${j.scheduled_date}T${j.scheduled_time || '23:59'}`);
        const completed = new Date(j.completed_at);
        return completed <= scheduled;
      }).length;
      const jobsChange = prevCompleted.length ? ((completedJobs.length - prevCompleted.length) / prevCompleted.length) * 100 : 0;
      const prevHours = (prevAssignments?.length || 0) * 8;
      const hoursChange = prevHours ? ((totalHours - prevHours) / prevHours) * 100 : 0;

      const onTimeRate = completedJobs.length ? (onTimeJobs.length / completedJobs.length) * 100 : 0;
      const prevOnTimeRate = prevCompleted.length ? (prevOnTime / prevCompleted.length) * 100 : 0;
      const onTimeChange = prevOnTimeRate ? ((onTimeRate - prevOnTimeRate) / prevOnTimeRate) * 100 : 0;

      return {
        totalHours,
        hoursChange,
        jobsCompleted: completedJobs.length,
        jobsChange,
        onTimeRate,
        onTimeChange,
        activeTeamMembers,
        teamChange: 0,
      } as KPIData;
    }
  });

  const { data: performanceData = [] } = useQuery({
    queryKey: ['team-performance-chart', dateRange, roleFilter],
    queryFn: async () => {
      const endDate = new Date();
      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const { data: jobs = [] } = await supabase
        .from('jobs')
        .select('id,status,scheduled_date,completed_at,scheduled_time')
        .gte('scheduled_date', startStr)
        .lte('scheduled_date', endStr);

      // Build date buckets
      const buckets: Record<string, { jobs: number; onTimeRate: number; completed: number; onTime: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const key = d.toISOString().split('T')[0];
        buckets[key] = { jobs: 0, onTimeRate: 0, completed: 0, onTime: 0 };
      }

      (jobs as any[]).forEach((j: any) => {
        if (j.status !== 'completed' || !j.completed_at) return;
        const completedDay = new Date(j.completed_at).toISOString().split('T')[0];
        if (!buckets[completedDay]) return;
        buckets[completedDay].jobs += 1;
        buckets[completedDay].completed += 1;
        const scheduled = j.scheduled_date ? new Date(`${j.scheduled_date}T${j.scheduled_time || '23:59'}`) : null;
        const completed = new Date(j.completed_at);
        if (scheduled && completed <= scheduled) {
          buckets[completedDay].onTime += 1;
        }
      });

      const data = Object.entries(buckets).map(([key, val]) => {
        const dateObj = new Date(key + 'T00:00:00');
        const onTime = val.completed ? (val.onTime / val.completed) * 100 : 0;
        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          jobs: val.jobs,
          onTime: Math.round(onTime * 10) / 10,
        };
      });

      return data;
    }
  });

  const exportData = () => {
    if (!kpiData) return;
    
    const csvData = [
      ['Metric', 'Value', 'Change'],
      ['Total Hours', kpiData.totalHours, `${kpiData.hoursChange.toFixed(1)}%`],
      ['Jobs Completed', kpiData.jobsCompleted, `${kpiData.jobsChange.toFixed(1)}%`],
      ['On-Time Rate', `${kpiData.onTimeRate.toFixed(1)}%`, `${kpiData.onTimeChange.toFixed(1)}%`],
      ['Active Team Members', kpiData.activeTeamMembers, `${kpiData.teamChange.toFixed(1)}%`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="driver">Drivers</SelectItem>
              <SelectItem value="dispatch">Dispatchers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.totalHours.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs">
              <span className={`font-medium ${
                (kpiData?.hoursChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(kpiData?.hoursChange || 0) >= 0 ? '+' : ''}{kpiData?.hoursChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.jobsCompleted || 0}</div>
            <div className="flex items-center text-xs">
              <span className={`font-medium ${
                (kpiData?.jobsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(kpiData?.jobsChange || 0) >= 0 ? '+' : ''}{kpiData?.jobsChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.onTimeRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs">
              <span className={`font-medium ${
                (kpiData?.onTimeChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(kpiData?.onTimeChange || 0) >= 0 ? '+' : ''}{kpiData?.onTimeChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Team</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.activeTeamMembers || 0}</div>
            <div className="flex items-center text-xs">
              <span className={`font-medium ${
                (kpiData?.teamChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(kpiData?.teamChange || 0) >= 0 ? '+' : ''}{kpiData?.teamChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="jobs" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Jobs Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="onTime" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="On-Time Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}