
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

  // Mock customer data
  const mockCustomer = {
    id: 'customer-1',
    name: 'ABC Construction Corp',
    email: 'contact@abcconstruction.com',
    phone: '(555) 123-4567',
    address: '123 Construction Ave, City, State 12345',
    accountStatus: 'active',
    totalJobs: 42,
    upcomingJobs: 3,
    completedJobs: 39,
    totalSpent: 15750,
    outstandingBalance: 2500
  };

  const mockJobs = [
    {
      id: 'job-1',
      type: 'delivery',
      status: 'scheduled',
      scheduledDate: '2024-01-25',
      scheduledTime: '09:00',
      address: '456 Site Location, City, State',
      items: ['Portable Toilet x2', 'Hand Wash Station x1'],
      driver: 'John Smith',
      estimatedCompletion: '10:00'
    },
    {
      id: 'job-2',
      type: 'service',
      status: 'completed',
      scheduledDate: '2024-01-20',
      scheduledTime: '14:00',
      address: '789 Another Site, City, State',
      items: ['Portable Toilet x3'],
      driver: 'Sarah Johnson',
      completedAt: '14:30'
    }
  ];

  const mockInvoices = [
    {
      id: 'invoice-1',
      number: 'INV-001',
      date: '2024-01-15',
      amount: 850,
      status: 'paid',
      dueDate: '2024-01-30',
      items: ['Weekly Service - 3 units', 'Additional Cleaning']
    },
    {
      id: 'invoice-2',
      number: 'INV-002',
      date: '2024-01-22',
      amount: 1200,
      status: 'pending',
      dueDate: '2024-02-05',
      items: ['Monthly Rental - 5 units', 'Delivery Fee']
    }
  ];

  const { data: customer = mockCustomer } = useQuery({
    queryKey: ['customer-portal', customerId],
    queryFn: async () => {
      // In real implementation, fetch customer data
      return mockCustomer;
    }
  });

  const { data: jobs = mockJobs } = useQuery({
    queryKey: ['customer-jobs', customerId],
    queryFn: async () => {
      // In real implementation, fetch customer jobs
      return mockJobs;
    }
  });

  const { data: invoices = mockInvoices } = useQuery({
    queryKey: ['customer-invoices', customerId],
    queryFn: async () => {
      // In real implementation, fetch customer invoices
      return mockInvoices;
    }
  });

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

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{customer.totalJobs}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Jobs</p>
                <p className="text-2xl font-bold">{customer.upcomingJobs}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${customer.totalSpent.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">${customer.outstandingBalance.toLocaleString()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.slice(0, 3).map((job) => {
                    const StatusIcon = getStatusIcon(job.status);
                    return (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{job.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {job.scheduledDate} at {job.scheduledTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(job.status)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.slice(0, 3).map((invoice) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.number}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {invoice.dueDate}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.amount}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => {
                  const StatusIcon = getStatusIcon(job.status);
                  return (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{job.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {job.scheduledDate} at {job.scheduledTime}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(job.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {job.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{job.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Driver: {job.driver}</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.items.map((item, index) => (
                            <Badge key={index} variant="outline">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => {
                  const StatusIcon = getStatusIcon(invoice.status);
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-sm text-muted-foreground">
                            Issued: {invoice.date} | Due: {invoice.dueDate}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {invoice.items.map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${invoice.amount}</p>
                        <Badge className={getStatusColor(invoice.status)}>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={customer.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={customer.email} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={customer.phone} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge className={getStatusColor(customer.accountStatus)}>
                    {customer.accountStatus}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={customer.address} readOnly />
              </div>
              <div className="pt-4">
                <Button>Update Profile</Button>
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
