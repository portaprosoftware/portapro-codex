import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Eye, Send, Mail, MessageSquare, Download, Printer, DollarSign, Calendar, User, Building, FileText, Receipt, Edit3, Undo2, Phone, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
// import { SendInvoiceModal } from './SendInvoiceModal';
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            Invoice Details
          </DialogTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsSendModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>

            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Invoice
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Invoice Information
                </h3>
                {getStatusBadge(invoice.status)}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Invoice #:</span>
                  <span className="font-mono">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(invoice.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Due Date:</span>
                  <span>{formatDate(invoice.due_date)}</span>
                </div>
                {invoice.quote_id && (
                  <div className="flex justify-between">
                    <span className="font-medium">Quote ID:</span>
                    <span className="font-mono">Q-{invoice.quote_id.slice(0, 8).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Customer Information
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="font-medium text-base">{invoice.customers?.name}</div>
                {invoice.customers?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{invoice.customers.email}</span>
                  </div>
                )}
                {invoice.customers?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{invoice.customers.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial Summary
            </h3>
            
            <div className="space-y-2">
              {invoice.subtotal && invoice.subtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
              )}
              {invoice.discount_value && invoice.discount_value > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount ({invoice.discount_type === 'percentage' ? `${invoice.discount_value}%` : 'Fixed'}):
                  </span>
                  <span>-{formatCurrency(invoice.discount_value)}</span>
                </div>
              )}
              {invoice.additional_fees && invoice.additional_fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Additional Fees:</span>
                  <span>{formatCurrency(invoice.additional_fees)}</span>
                </div>
              )}
              {invoice.tax_amount && invoice.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Payment History</h3>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={payment.status === 'reversed' ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}
                          >
                            {payment.status === 'reversed' ? 'Reversed' : 'Completed'}
                          </Badge>
                        </div>
                        
                        {payment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="destructive"
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
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Method: {payment.payment_method?.replace('_', ' ').toUpperCase()}</span>
                          <span>Date: {format(new Date(payment.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        {payment.reference_number && (
                          <div className="mt-1">Reference: {payment.reference_number}</div>
                        )}
                        {payment.notes && (
                          <div className="mt-1">Notes: {payment.notes}</div>
                        )}
                        {payment.reversal_reason && (
                          <div className="mt-1 text-red-600">Reversal Reason: {payment.reversal_reason}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 border-0"
            >
              Close
            </Button>
          </div>
        </div>

        {/* <SendInvoiceModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          invoice={invoice}
        /> */}

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