
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerPortalDashboard } from '@/components/customer-portal/CustomerPortalDashboard';
import { ServiceHistoryTab } from '@/components/customer-portal/ServiceHistoryTab';
import { RequestsTab } from '@/components/customer-portal/RequestsTab';
import { 
  User, 
  Calendar, 
  FileText, 
  CreditCard, 
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CustomerPortalProps {
  customerId?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ customerId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [supportMessage, setSupportMessage] = useState('');

  // Fetch real customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-portal', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  // Fetch real jobs data
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['customer-jobs', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          job_type,
          status,
          scheduled_date,
          scheduled_time,
          actual_completion_time
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  // Fetch real invoices data
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['customer-invoices', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  if (customerLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'overdue': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Portal</h1>
          <p className="text-muted-foreground">Welcome back, {customer.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" />
            Support
          </Button>
          <Button variant="outline">
            <Phone className="w-4 h-4 mr-2" />
            Call Us
          </Button>
        </div>
      </div>


      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CustomerPortalDashboard customerId={customerId || ''} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ServiceHistoryTab customerId={customerId || ''} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <RequestsTab customerId={customerId || ''} />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No jobs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => {
                    const StatusIcon = getStatusIcon(job.status);
                    
                    return (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium capitalize">{job.job_type?.replace('_', ' ') || 'Service'}</p>
                              <p className="text-sm text-muted-foreground">
                                {job.job_number || `Job #${job.id.slice(-8)}`}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(job.status)} variant="outline">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {job.status?.replace('_', ' ') || 'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                              {job.scheduled_time && ` at ${job.scheduled_time}`}
                            </span>
                          </div>
                        </div>
                        
                        {job.actual_completion_time && (
                          <div className="border-t pt-3">
                            <p className="text-sm text-muted-foreground">
                              Completed: {new Date(job.actual_completion_time).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-32"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">
                              Issued: {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}
                              {invoice.due_date && ` | Due: ${new Date(invoice.due_date).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${Number(invoice.amount).toLocaleString()}</p>
                          <Badge className={getStatusColor(invoice.status)} variant="outline">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {invoice.status}
                          </Badge>
                          <div className="mt-2">
                            <Button size="sm" variant="outline">
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={customer.name || ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={customer.email || ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={customer.phone || ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <Badge variant="outline">
                      {customer.customer_type?.replace('_', ' ') || 'Standard'}
                    </Badge>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Service Address</Label>
                <Input 
                  value={customer?.service_address || customer?.address || ''} 
                  readOnly 
                />
              </div>
              <div className="pt-4">
                <Button disabled>Update Profile</Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Contact support to update your profile information
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea 
                  placeholder="Describe your issue or question..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                />
              </div>
              <Button>Send Message</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@company.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">Monday - Friday: 7:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
