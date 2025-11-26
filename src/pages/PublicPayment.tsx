import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, XCircle, ArrowLeft, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { tenantTable } from '@/lib/db/tenant';
import { useTenantId } from '@/lib/tenantQuery';

export default function PublicPayment() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const tenantId = useTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) {
        setError('Invalid invoice link');
        setLoading(false);
        return;
      }

      if (!tenantId) {
        return;
      }

      try {
        const { data: invoiceRecord, error: fetchError } = await tenantTable(supabase, tenantId, 'invoices')
          .select('id, invoice_number, amount, status, customer_id')
          .eq('id', invoiceId)
          .single();

        if (fetchError || !invoiceRecord) {
          throw new Error('Invoice not found');
        }

        let customer = null;

        if (invoiceRecord.customer_id) {
          const { data: customerData, error: customerError } = await tenantTable(supabase, tenantId, 'customers')
            .select('id, name, email')
            .eq('id', invoiceRecord.customer_id)
            .maybeSingle();

          if (customerError) {
            console.error('Error loading customer:', customerError);
          } else {
            customer = customerData;
          }
        }

        setInvoice({ ...invoiceRecord, customer });
        setAmount(invoiceRecord.amount);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading invoice:', err);
        setError(err.message || 'Failed to load invoice');
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, tenantId]);

  const handlePayment = async () => {
    if (amount <= 0 || amount > invoice.amount) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-invoice-checkout', {
        body: {
          invoiceId: invoice.id,
          amount: amount,
          isPublic: true,
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Error creating payment:', err);
      toast.error(err.message || 'Failed to process payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing payment link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center">Payment Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{error}</p>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoice && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-center">Pay Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Invoice Number:</span>
                <span className="text-sm font-mono font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="text-sm font-medium">{invoice.customer?.name || 'Unknown customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Amount:</span>
                <span className="text-lg font-bold">
                  ${invoice.amount?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={invoice.amount}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You can pay the full amount or a partial payment
              </p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={processing || amount <= 0}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with Card
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
