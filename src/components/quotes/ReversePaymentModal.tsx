import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, DollarSign, Undo2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ReversePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
  invoice: any;
}

export function ReversePaymentModal({ isOpen, onClose, payment, invoice }: ReversePaymentModalProps) {
  const [reversalReason, setReversalReason] = useState('');
  const queryClient = useQueryClient();

  const reversePaymentMutation = useMutation({
    mutationFn: async (reason: string) => {
      // Create reversal payment record
      const { error: reversalError } = await supabase
        .from('payments')
        .insert({
          invoice_id: payment.invoice_id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          status: 'reversed',
          reversal_reason: reason,
          original_payment_id: payment.id,
          created_by: 'current_user', // Will be replaced with actual Clerk user ID
          reversed_at: new Date().toISOString(),
          reversed_by: 'current_user'
        });

      if (reversalError) throw reversalError;

      // Get payment totals to determine new invoice status
      const { data: totalsData, error: totalsError } = await supabase
        .rpc('get_invoice_payment_totals', { invoice_uuid: invoice.id });

      if (totalsError) throw totalsError;

      const totals = totalsData as { total_paid: number; total_reversed: number; net_paid: number };
      const netPaid = totals.net_paid - payment.amount; // Subtract the reversed amount
      let newStatus = 'unpaid';
      if (netPaid > 0) {
        newStatus = netPaid >= invoice.amount ? 'paid' : 'partial';
      }

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Payment reversed successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to reverse payment: ' + error.message);
    }
  });

  const handleReverse = () => {
    if (!reversalReason.trim()) {
      toast.error('Please provide a reason for the reversal');
      return;
    }
    reversePaymentMutation.mutate(reversalReason);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Reverse Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200">Warning</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This action will reverse the payment and update the invoice status. This cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">Payment Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Amount:</span>
                <span className="font-bold text-lg">{formatCurrency(payment.amount)}</span>
              </div>
              
              <div>
                <span className="font-medium">Method:</span>
                <Badge variant="outline" className="ml-2">
                  {payment.payment_method?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div className="col-span-2">
                <span className="font-medium">Date:</span>
                <span className="ml-2">{format(new Date(payment.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
              
              {payment.reference_number && (
                <div className="col-span-2">
                  <span className="font-medium">Reference:</span>
                  <span className="ml-2 font-mono">{payment.reference_number}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Reversal Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-base font-semibold">
              Reason for Reversal <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Please explain why this payment is being reversed..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 border-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReverse}
              disabled={reversePaymentMutation.isPending || !reversalReason.trim()}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              {reversePaymentMutation.isPending ? 'Reversing...' : 'Reverse Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}