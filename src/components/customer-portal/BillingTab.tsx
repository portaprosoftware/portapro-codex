import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign,
  Calendar,
  Download,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Receipt,
  Settings,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BillingTabProps {
  customerId: string;
}

export const BillingTab: React.FC<BillingTabProps> = ({ customerId }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Fetch invoices data
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['customer-invoices', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  // Fetch customer financial summary
  const { data: financialSummary } = useQuery({
    queryKey: ['customer-financials', customerId],
    queryFn: async () => {
      const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const outstanding = totalInvoiced - totalPaid;
      const overdue = invoices.filter(inv => 
        inv.status === 'unpaid' && 
        inv.due_date && 
        new Date(inv.due_date) < new Date()
      ).reduce((sum, inv) => sum + (inv.amount || 0), 0);

      return {
        totalInvoiced,
        totalPaid,
        outstanding,
        overdue,
        paymentMethods: 2, // Mock data
        autopayEnabled: false // Mock data
      };
    },
    enabled: invoices.length > 0,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount / 100);
  };

  const getInvoiceStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'completed';
      case 'unpaid': return 'pending';
      case 'overdue': return 'overdue';
      case 'draft': return 'draft';
      default: return 'inactive';
    }
  };

  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'unpaid': return Clock;
      case 'overdue': return AlertCircle;
      case 'draft': return FileText;
      default: return FileText;
    }
  };

  if (invoicesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Billing & Payments</h3>
        <p className="text-sm text-muted-foreground">
          Manage your invoices, payments, and billing preferences
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(financialSummary?.totalInvoiced || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(financialSummary?.totalPaid || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(financialSummary?.outstanding || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(financialSummary?.overdue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Invoice History</h4>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>

          <div className="space-y-3">
            {invoices.map((invoice) => {
              const StatusIcon = getInvoiceStatusIcon(invoice.status);
              return (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{invoice.invoice_number}</h5>
                            <Badge variant={getInvoiceStatusVariant(invoice.status) as any}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Due: {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(invoice.amount || 0)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Amount</label>
                                    <p className="text-lg font-semibold">{formatCurrency(invoice.amount || 0)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge variant={getInvoiceStatusVariant(invoice.status) as any}>
                                      {invoice.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Invoice Date</label>
                                    <p className="text-sm">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Due Date</label>
                                    <p className="text-sm">
                                      {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                
                                {invoice.notes && (
                                  <div>
                                    <label className="text-sm font-medium">Notes</label>
                                    <p className="text-sm text-muted-foreground mt-1">{invoice.notes}</p>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                  <Button className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                  </Button>
                                  {invoice.status === 'unpaid' && (
                                    <Button variant="outline" className="gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      Pay Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-3 w-3" />
                            PDF
                          </Button>

                          {invoice.status === 'unpaid' && (
                            <Button size="sm" className="gap-1">
                              <CreditCard className="h-3 w-3" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Payment Methods</h4>
            <Button className="gap-2">
              <CreditCard className="h-4 w-4" />
              Add Payment Method
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h5 className="font-medium mb-2">No Payment Methods</h5>
              <p className="text-muted-foreground mb-4">
                Add a credit card or bank account to make payments easier
              </p>
              <Button>Add Payment Method</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AutoPay Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically pay invoices when they're due
                  </p>
                </div>
                <Button variant="outline">Enable AutoPay</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Account Statements</h4>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download Statement
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h5 className="font-medium mb-2">Account Statements</h5>
              <p className="text-muted-foreground mb-4">
                Download monthly and annual account statements
              </p>
              <Button variant="outline">Generate Statement</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h4 className="text-md font-medium">Billing Settings</h4>

          <Card>
            <CardHeader>
              <CardTitle>Billing Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for new invoices and payment confirmations
                  </p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Get reminded before payments are due
                  </p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Update your billing address for invoices and tax purposes
              </p>
              <Button variant="outline">Update Address</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};