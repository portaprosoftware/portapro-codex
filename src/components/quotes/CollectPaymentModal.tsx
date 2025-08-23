import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, DollarSign, Calendar, User, Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

interface PaymentData {
  amount: number;
  paymentMethod: 'credit_card' | 'cash' | 'check' | 'bank_transfer';
  referenceNumber?: string;
  notes?: string;
}

export function CollectPaymentModal({ isOpen, onClose, invoice }: CollectPaymentModalProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: invoice?.amount || 0,
    paymentMethod: 'credit_card',
    referenceNumber: '',
    notes: ''
  });
  
  const queryClient = useQueryClient();

  const processPaymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          amount: data.amount,
          payment_method: data.paymentMethod,
          reference_number: data.referenceNumber || null,
          notes: data.notes || null,
          status: 'completed',
          created_by: 'current_user' // Will be replaced with actual Clerk user ID
        });

      if (paymentError) throw paymentError;

      // Update invoice status
      const newStatus = data.amount >= invoice.amount ? 'paid' : 'partial';
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
      toast.success('Payment processed successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to process payment: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentData.amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    if (paymentData.amount > invoice.amount) {
      toast.error('Payment amount cannot exceed invoice total');
      return;
    }

    processPaymentMutation.mutate(paymentData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'paid': { gradient: 'bg-gradient-to-r from-green-500 to-green-600', label: 'Paid' },
      'unpaid': { gradient: 'bg-gradient-to-r from-red-500 to-red-600', label: 'Unpaid' },
      'partial': { gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600', label: 'Partial' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      label: status.charAt(0).toUpperCase() + status.slice(1)
    };

    return (
      <Badge className={`${config.gradient} text-white border-0 font-bold px-3 py-1 rounded-full`}>
        {config.label}
      </Badge>
    );
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Collect Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Invoice Summary</h3>
              {getStatusBadge(invoice.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Invoice #:</span>
                <span className="font-mono">{invoice.invoice_number}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Customer:</span>
                <span>{invoice.customers?.name || 'Unknown'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.amount)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Due Date:</span>
                <span>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Payment Method</Label>
              <RadioGroup
                value={paymentData.paymentMethod}
                onValueChange={(value: any) => setPaymentData({ ...paymentData, paymentMethod: value })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    Credit Card
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                  <RadioGroupItem value="check" id="check" />
                  <Label htmlFor="check" className="cursor-pointer">
                    Check
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="cursor-pointer">
                    Bank Transfer
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">Payment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={invoice.amount}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum: {formatCurrency(invoice.amount)}
              </p>
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="reference" className="text-base font-semibold">
                Reference Number <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="reference"
                value={paymentData.referenceNumber}
                onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                placeholder="Check #, Transaction ID, etc."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold">
                Notes <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Additional payment details..."
                rows={3}
              />
            </div>

            {/* Stripe Integration Notice */}
            {paymentData.paymentMethod === 'credit_card' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  Credit card processing will be handled through Stripe integration.
                </p>
              </div>
            )}

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
                type="submit"
                disabled={processPaymentMutation.isPending || paymentData.amount <= 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              >
                {processPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}