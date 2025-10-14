import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateDepositPaymentParams {
  customerId: string;
  amount: number;
  jobId?: string;
  quoteId?: string;
  invoiceId?: string;
  depositType: 'flat' | 'percentage';
  depositPercentage?: number;
  dueDate?: Date | null;
}

export const useDepositPayment = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createPaymentIntent = async (params: CreateDepositPaymentParams) => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment-intent', {
        body: {
          action: 'create_payment_intent',
          amount: params.amount,
          customerId: params.customerId,
          jobId: params.jobId,
          quoteId: params.quoteId,
          invoiceId: params.invoiceId,
          paymentType: 'deposit',
          description: `Deposit payment`,
        },
      });

      if (error) throw error;

      return {
        success: true,
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        paymentId: data.paymentId,
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment intent',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  };

  const createPaymentLink = async (params: CreateDepositPaymentParams) => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment-intent', {
        body: {
          action: 'create_payment_link',
          amount: params.amount,
          customerId: params.customerId,
          jobId: params.jobId,
          quoteId: params.quoteId,
          invoiceId: params.invoiceId,
          paymentType: 'deposit',
          description: `Deposit payment`,
        },
      });

      if (error) throw error;

      return {
        success: true,
        paymentLink: data.paymentLink,
        paymentLinkId: data.paymentLinkId,
        paymentId: data.paymentId,
      };
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment link',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreating,
    createPaymentIntent,
    createPaymentLink,
  };
};
