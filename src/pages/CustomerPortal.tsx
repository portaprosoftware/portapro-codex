import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, DollarSign, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PortalData {
  customer: any;
  quotes: any[];
  invoices: any[];
  jobs: any[];
}

export default function CustomerPortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      if (!token) {
        setError('Invalid portal link');
        setLoading(false);
        return;
      }

      try {
        // Verify token and get customer ID
        const { data: tokenData, error: tokenError } = await supabase
          .from('customer_portal_tokens')
          .select('*')
          .eq('token', token)
          .single();

        if (tokenError) throw new Error('Invalid or expired portal link');

        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
          throw new Error('This portal link has expired');
        }

        // Check if token was revoked
        if (tokenData.revoked_at) {
          throw new Error('This portal link is no longer valid');
        }

        // Update token usage
        await supabase
          .from('customer_portal_tokens')
          .update({
            used_at: new Date().toISOString(),
            usage_count: (tokenData.usage_count || 0) + 1,
          })
          .eq('id', tokenData.id);

        // Fetch customer data
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', tokenData.customer_id)
          .single();

        if (customerError) throw customerError;

        // Fetch quotes with deposit information
        const { data: quotes, error: quotesError } = await supabase
          .from('quotes')
          .select('*')
          .eq('customer_id', tokenData.customer_id)
          .order('created_at', { ascending: false });

        if (quotesError) throw quotesError;

        // Fetch invoices with payment information
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('customer_id', tokenData.customer_id)
          .order('created_at', { ascending: false });

        if (invoicesError) throw invoicesError;

        // Fetch jobs
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('customer_id', tokenData.customer_id)
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;

        setPortalData({
          customer,
          quotes: quotes || [],
          invoices: invoices || [],
          jobs: jobs || [],
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading portal:', err);
        setError(err.message || 'Failed to load portal data');
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [token]);

  const handlePayDeposit = async (quoteId: string, depositAmount: number) => {
    try {
      // Create payment for deposit
      const { data, error } = await supabase.functions.invoke('stripe-payment-intent', {
        body: {
          action: 'create_payment_link',
          amount: depositAmount,
          customerId: portalData?.customer.id,
          quoteId: quoteId,
          paymentType: 'deposit',
          description: 'Deposit payment for quote',
        },
      });

      if (error) throw error;

      // Redirect to payment page
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (err: any) {
      console.error('Error creating deposit payment:', err);
      toast.error('Failed to create payment link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {error || 'Unable to access customer portal'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, {portalData.customer.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              View your quotes, invoices, and upcoming services
            </p>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="quotes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quotes">
              <FileText className="h-4 w-4 mr-2" />
              Quotes ({portalData.quotes.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <DollarSign className="h-4 w-4 mr-2" />
              Invoices ({portalData.invoices.length})
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Calendar className="h-4 w-4 mr-2" />
              Services ({portalData.jobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="space-y-4">
            {portalData.quotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No quotes available</p>
                </CardContent>
              </Card>
            ) : (
              portalData.quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(quote.created_at), 'PPP')}
                        </p>
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-bold">${quote.total_amount?.toFixed(2)}</p>
                      </div>
                      {quote.deposit_required && (
                        <div>
                          <p className="text-sm text-muted-foreground">Deposit Required</p>
                          <p className="text-lg font-bold text-primary">
                            ${quote.deposit_amount?.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {quote.deposit_required && quote.deposit_status !== 'paid' && (
                      <Button
                        onClick={() => handlePayDeposit(quote.id, quote.deposit_amount)}
                        className="w-full"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pay Deposit (${quote.deposit_amount?.toFixed(2)})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            {portalData.invoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No invoices available</p>
                </CardContent>
              </Card>
            ) : (
              portalData.invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Due: {format(new Date(invoice.due_date), 'PPP')}
                        </p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Due</p>
                        <p className="text-2xl font-bold">${invoice.amount?.toFixed(2)}</p>
                      </div>
                      {invoice.status === 'unpaid' && (
                        <Button>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            {portalData.jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No scheduled services</p>
                </CardContent>
              </Card>
            ) : (
              portalData.jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{job.job_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {job.job_type && job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                        </p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Scheduled Date</span>
                        <span className="text-sm font-medium">
                          {format(new Date(job.scheduled_date), 'PPP')}
                        </span>
                      </div>
                      {job.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{job.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
