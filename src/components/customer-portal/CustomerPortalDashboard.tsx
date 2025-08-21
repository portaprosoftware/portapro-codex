import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CreditCard, 
  AlertCircle,
  Clock,
  CheckCircle,
  Wrench,
  Package
} from 'lucide-react';

interface CustomerPortalDashboardProps {
  customerId: string;
}

export const CustomerPortalDashboard: React.FC<CustomerPortalDashboardProps> = ({ customerId }) => {
  // Fetch units on site (from equipment_assignments)
  const { data: unitsOnSite = 0 } = useQuery({
    queryKey: ['customer-units-onsite', customerId],
    queryFn: async () => {
      const { count } = await supabase
        .from('equipment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_service')
        .eq('job_id', customerId); // This would need proper job linking
      return count || 0;
    },
  });

  // Fetch next service date (from jobs table)
  const { data: nextService } = useQuery({
    queryKey: ['customer-next-service', customerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('scheduled_date, job_type')
        .eq('customer_id', customerId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch open requests (pending/in_progress jobs)
  const { data: openRequests = 0 } = useQuery({
    queryKey: ['customer-open-requests', customerId],
    queryFn: async () => {
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .in('status', ['scheduled', 'in_progress', 'pending']);
      return count || 0;
    },
  });

  // Fetch balance due (from unpaid invoices)
  const { data: balanceDue = 0 } = useQuery({
    queryKey: ['customer-balance-due', customerId],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('status', 'unpaid');
      
      return invoices?.reduce((sum, invoice) => sum + Number(invoice.amount), 0) || 0;
    },
  });

  // Fetch overdue jobs for alerts
  const { data: overdueJobs = 0 } = useQuery({
    queryKey: ['customer-overdue-jobs', customerId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .lt('scheduled_date', today)
        .neq('status', 'completed');
      return count || 0;
    },
  });

  // Fetch recent jobs for activity feed
  const { data: recentJobs = [] } = useQuery({
    queryKey: ['customer-recent-jobs', customerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('id, job_type, status, scheduled_date, actual_completion_time, job_number')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const formatNextService = () => {
    if (!nextService) return "No upcoming services";
    const date = new Date(nextService.scheduled_date);
    const capitalizedJobType = nextService.job_type.charAt(0).toUpperCase() + nextService.job_type.slice(1);
    return `${capitalizedJobType} - ${date.toLocaleDateString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/20 text-success border-success/20';
      case 'scheduled': return 'bg-primary/20 text-primary border-primary/20';
      case 'in_progress': return 'bg-warning/20 text-warning border-warning/20';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'scheduled': return Calendar;
      case 'in_progress': return Clock;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your account and services</p>
      </div>

      {/* Alert Banner for Overdue Jobs */}
      {overdueJobs > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  You have {overdueJobs} overdue service{overdueJobs > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact us to reschedule or complete these services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Units on Site</p>
                <p className="text-2xl font-bold">{unitsOnSite}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-warning/5" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Next Service</p>
                <p className="text-sm font-semibold leading-tight">{formatNextService()}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Open Requests</p>
                <p className="text-2xl font-bold">{openRequests}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-destructive/5" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Balance Due</p>
                <p className="text-2xl font-bold">${balanceDue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => {
                const StatusIcon = getStatusIcon(job.status);
                const date = job.actual_completion_time || job.scheduled_date;
                const displayDate = date ? new Date(date).toLocaleDateString() : 'N/A';
                
                return (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <StatusIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{job.job_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.job_number || `Job #${job.id.slice(-8)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(job.status)} variant="outline">
                        {job.status.replace('_', ' ')}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{displayDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};