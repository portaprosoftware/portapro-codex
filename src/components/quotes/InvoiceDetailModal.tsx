import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Eye, Send, Download, Printer, DollarSign, Edit3, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SendInvoiceModal } from './SendInvoiceModal';
import { EditInvoiceModal } from './EditInvoiceModal';
import { ReversePaymentModal } from './ReversePaymentModal';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export function InvoiceDetailModal({ isOpen, onClose, invoice }: InvoiceDetailModalProps) {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch payments for this invoice
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!invoice?.id && isOpen
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Invoice Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                onClick={() => setIsSendModalOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-lg font-semibold">Invoice #{invoice.invoice_number}</h2>
              <p className="text-gray-600">Created: {formatDate(invoice.created_at)}</p>
              <p className="text-gray-600">Due: {formatDate(invoice.due_date)}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(invoice.status)}
              <p className="text-2xl font-bold mt-2">{formatCurrency(invoice.amount)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <p className="font-medium">{invoice.customers?.name}</p>
            {invoice.customers?.email && <p className="text-gray-600">{invoice.customers.email}</p>}
            {invoice.customers?.phone && <p className="text-gray-600">{invoice.customers.phone}</p>}
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Payment History</h3>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        <Badge 
                          variant={payment.status === 'reversed' ? 'destructive' : 'default'}
                          className={payment.status === 'reversed' ? '' : 'bg-green-100 text-green-800'}
                        >
                          {payment.status === 'reversed' ? 'Reversed' : 'Completed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {payment.payment_method?.replace('_', ' ').toUpperCase()} • {format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </p>
                      {payment.reversal_reason && (
                        <p className="text-sm text-red-600">Reason: {payment.reversal_reason}</p>
                      )}
                    </div>
                    {payment.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsReverseModalOpen(true);
                        }}
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        Reverse
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <SendInvoiceModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          invoice={invoice}
        />

        <EditInvoiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          invoice={invoice}
        />

        <ReversePaymentModal
          isOpen={isReverseModalOpen}
          onClose={() => {
            setIsReverseModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          invoice={invoice}
        />
      </DialogContent>
    </Dialog>
  );
}