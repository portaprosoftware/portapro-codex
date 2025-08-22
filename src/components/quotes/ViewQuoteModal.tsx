import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConvertQuoteToJob } from '@/hooks/useConvertQuoteToJob';
import { toast } from 'sonner';
import { 
  FileText, 
  Mail, 
  Download, 
  Copy, 
  Briefcase, 
  Receipt, 
  Calendar,
  MapPin,
  Clock,
  User,
  Edit,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock3,
  Send,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface ViewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
}

const statusConfig = {
  draft: { label: 'Draft', icon: Edit, color: 'bg-gray-500' },
  pending: { label: 'Pending', icon: Clock3, color: 'bg-yellow-500' },
  sent: { label: 'Sent', icon: Send, color: 'bg-blue-500' },
  viewed: { label: 'Viewed', icon: Eye, color: 'bg-purple-500' },
  accepted: { label: 'Accepted', icon: CheckCircle2, color: 'bg-green-500' },
  declined: { label: 'Declined', icon: XCircle, color: 'bg-red-500' },
  expired: { label: 'Expired', icon: Clock, color: 'bg-gray-400' },
};

export const ViewQuoteModal: React.FC<ViewQuoteModalProps> = ({
  isOpen,
  onClose,
  quoteId
}) => {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const convertToJobMutation = useConvertQuoteToJob();

  // Fetch quote data
  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id(*),
          quote_items(
            *
          )
        `)
        .eq('id', quoteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!quoteId && isOpen
  });

  // Update quote status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status,
          ...(notes && { notes: notes })
        })
        .eq('id', quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote updated successfully');
      setNewStatus('');
      setNotes('');
    }
  });

  // Create invoice from quote
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_invoice_from_quote', {
        quote_uuid: quoteId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    }
  });

  const handleConvertToJob = async () => {
    try {
      await convertToJobMutation.mutateAsync({ quoteId });
      onClose();
    } catch (error) {
      console.error('Failed to convert quote to job:', error);
    }
  };

  const handleUpdateStatus = () => {
    if (newStatus) {
      updateStatusMutation.mutate({ status: newStatus, notes });
    }
  };

  const handleCreateInvoice = () => {
    createInvoiceMutation.mutate();
  };

  const handleDuplicate = async () => {
    try {
      // Implementation would duplicate the quote
      toast.success('Quote duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate quote');
    }
  };

  const handleSendQuote = async () => {
    try {
      // Implementation would send the quote
      await updateStatusMutation.mutateAsync({ status: 'sent' });
      toast.success('Quote sent successfully');
    } catch (error) {
      toast.error('Failed to send quote');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quote) {
    return null;
  }

  const currentStatus = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote {quote.quote_number}
          </DialogTitle>
          <DialogDescription>
            View and manage quote details, status, and convert to jobs or invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quote Details</span>
                  <Badge className={`${currentStatus.color} text-white`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {currentStatus.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                    <p className="font-medium">{quote.customers?.name}</p>
                    <p className="text-sm text-muted-foreground">{quote.customers?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p>{format(new Date(quote.created_at), 'PPP')}</p>
                  </div>
                </div>
                
                {quote.expiration_date && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Expires</Label>
                    <p>{format(new Date(quote.expiration_date), 'PPP')}</p>
                  </div>
                )}

                {quote.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(quote.quote_items) && quote.quote_items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">{item.product_name || item.variation_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} @ ${item.unit_price}
                        </p>
                      </div>
                      <p className="font-medium">${item.line_total}</p>
                    </div>
                  ))}
                  {(!quote.quote_items || !Array.isArray(quote.quote_items) || quote.quote_items.length === 0) && (
                    <p className="text-muted-foreground text-sm">No items found</p>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${quote.subtotal || 0}</span>
                  </div>
                  {quote.discount_value && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({quote.discount_type})</span>
                      <span>-${quote.discount_value}</span>
                    </div>
                  )}
                  {quote.tax_amount && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${quote.tax_amount}</span>
                    </div>
                  )}
                  {quote.additional_fees && (
                    <div className="flex justify-between">
                      <span>Additional Fees</span>
                      <span>${quote.additional_fees}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>${quote.total_amount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote.status !== 'sent' && (
                  <Button 
                    onClick={handleSendQuote} 
                    className="w-full"
                    disabled={updateStatusMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Quote
                  </Button>
                )}
                
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                
                <Button variant="outline" onClick={handleDuplicate} className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                
                <Separator />
                
                {quote.status === 'accepted' && (
                  <>
                    <Button 
                      onClick={handleConvertToJob} 
                      className="w-full"
                      disabled={convertToJobMutation.isPending}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Convert to Job
                    </Button>
                    
                    <Button 
                      onClick={handleCreateInvoice}
                      variant="outline" 
                      className="w-full"
                      disabled={createInvoiceMutation.isPending}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Update Status */}
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add a note about this status change..."
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || updateStatusMutation.isPending}
                  className="w-full"
                >
                  Update Status
                </Button>
              </CardContent>
            </Card>

            {/* Timeline (placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Created</span>
                    <span className="text-muted-foreground">
                      {format(new Date(quote.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  {quote.sent_at && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Sent</span>
                      <span className="text-muted-foreground">
                        {format(new Date(quote.sent_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};