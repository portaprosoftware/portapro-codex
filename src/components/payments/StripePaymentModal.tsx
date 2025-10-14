import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  customerId: string;
  jobId?: string;
  quoteId?: string;
  invoiceId?: string;
  paymentType?: 'deposit' | 'partial' | 'full';
  description?: string;
  onSuccess?: (paymentId: string) => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  open,
  onOpenChange,
  amount,
  customerId,
  jobId,
  quoteId,
  invoiceId,
  paymentType = 'deposit',
  description,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Call Stripe edge function to create payment intent
      const { data, error } = await supabase.functions.invoke('stripe-payment-intent', {
        body: {
          action: 'create_payment_intent',
          amount,
          customerId,
          jobId,
          quoteId,
          invoiceId,
          paymentType,
          description: description || `${paymentType} payment`,
        },
      });

      if (error) throw error;

      const { clientSecret, paymentId } = data;

      // In a real implementation, you would use Stripe Elements here
      // For now, we'll simulate a successful payment
      console.log('Payment Intent created:', clientSecret);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status to completed
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: 'completed', paid_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      setPaymentStatus('success');
      toast({
        title: 'Payment Successful',
        description: `${paymentType} of $${amount.toFixed(2)} has been processed.`,
      });

      if (onSuccess) {
        onSuccess(paymentId);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setPaymentStatus('idle');
      }, 2000);

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      toast({
        title: 'Payment Failed',
        description: error.message || 'Unable to process payment.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Complete your {paymentType} payment of ${amount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Amount:</span>
              <span className="font-bold text-lg">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Payment Type:</span>
              <span className="capitalize">{paymentType}</span>
            </div>
          </div>

          {/* Status Messages */}
          {paymentStatus === 'processing' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Processing your payment...</AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'success' && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Payment successful! Closing...
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Stripe Elements would go here in production */}
          {paymentStatus === 'idle' && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Stripe payment form will appear here
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || paymentStatus === 'success'}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay ${amount.toFixed(2)}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
