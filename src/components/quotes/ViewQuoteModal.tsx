import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, X, MapPin, Phone, Mail, Calendar, DollarSign, Check, XCircle, Send, MessageSquare, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ViewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
}

export const ViewQuoteModal = ({ isOpen, onClose, quoteId }: ViewQuoteModalProps) => {
  const [showContactEdit, setShowContactEdit] = useState(false);
  const [contactData, setContactData] = useState({
    email: '',
    phone: '',
    name: ''
  });
  const queryClient = useQueryClient();
  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote-details', quoteId],
    queryFn: async () => {
      // Fetch quote and customer data
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id (
            name,
            email,
            phone,
            service_street,
            service_street2,
            service_city,
            service_state,
            service_zip
          )
        `)
        .eq('id', quoteId)
        .single();
      
      if (quoteError) throw quoteError;

      // Fetch quote items separately
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          id,
          product_name,
          variation_name,
          quantity,
          unit_price,
          line_total,
          rental_duration_days
        `)
        .eq('quote_id', quoteId);
      
      if (itemsError) throw itemsError;

      return {
        ...quoteData,
        quote_items: itemsData || []
      };
    },
    enabled: !!quoteId && isOpen,
  });

  // Auto-fill contact info when quote data loads
  useEffect(() => {
    if (quote?.customers) {
      const customer = quote.customers as any;
      setContactData({
        email: customer.email || '',
        phone: customer.phone || '',
        name: customer.name || ''
      });
    }
  }, [quote]);

  const updateQuoteStatus = useMutation({
    mutationFn: async (status: 'accepted' | 'rejected') => {
      const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', quoteId);
      
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      toast.success(`Quote ${status === 'accepted' ? 'approved' : 'declined'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-details', quoteId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update quote status");
    }
  });

  const handleSendOption = () => {
    const currentData = {
      email: customer?.email || '',
      phone: customer?.phone || '',
      name: customer?.name || ''
    };
    
    setContactData(currentData);
    setShowContactEdit(true);
  };

  const handleSendWithEditedContact = (method: 'email' | 'sms' | 'both') => {
    sendQuoteEmail.mutate({
      email: contactData.email,
      phone: contactData.phone,
      method
    });
  };

  const sendQuoteEmail = useMutation({
    mutationFn: async ({ email, phone, method }: { email?: string; phone?: string; method: 'email' | 'sms' | 'both' }) => {
      if (!quote) {
        throw new Error('Quote not available');
      }

      if (method === 'email' && !email) {
        throw new Error('Email address is required');
      }

      if ((method === 'sms' || method === 'both') && !phone) {
        throw new Error('Phone number is required');
      }

      const customer = quote.customers as any;
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          quoteId: quote.id,
          customerEmail: email,
          customerPhone: phone,
          customerName: customer?.name,
          sendMethod: method
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Quote sent successfully!');
      setShowContactEdit(false);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-details', quoteId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send quote");
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { 
        gradient: 'bg-gradient-to-r from-gray-500 to-gray-600', 
        label: 'Draft' 
      },
      sent: { 
        gradient: 'bg-gradient-to-r from-blue-500 to-blue-600', 
        label: 'Sent' 
      },
      pending: { 
        gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600', 
        label: 'Pending' 
      },
      accepted: { 
        gradient: 'bg-gradient-to-r from-green-500 to-green-600', 
        label: 'Accepted' 
      },
      expired: { 
        gradient: 'bg-gradient-to-r from-red-500 to-red-600', 
        label: 'Expired' 
      },
      rejected: { 
        gradient: 'bg-gradient-to-r from-red-500 to-red-600', 
        label: 'Rejected' 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge className={`${config.gradient} text-white border-0 font-bold px-3 py-1 rounded-full`}>
        {config.label}
      </Badge>
    );
  };

  const formatAddress = (customer: any) => {
    if (!customer) return '';
    const parts = [
      customer.service_street,
      customer.service_street2,
      customer.service_city,
      customer.service_state,
      customer.service_zip
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading quote details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quote) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Quote not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const customer = quote.customers as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-bold">
              Quote {quote.quote_number || `Q-${quote.id.slice(0, 8)}`}
            </DialogTitle>
            {getStatusBadge(quote.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quote Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Quote Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(quote.created_at)}
                  </span>
                </div>
                {quote.expiration_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(quote.expiration_date)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(quote.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Customer Information</h3>
              <div className="space-y-2">
                <div className="font-medium text-foreground">{customer?.name}</div>
                {customer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{customer.email}</span>
                  </div>
                )}
                {customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{customer.phone}</span>
                  </div>
                )}
                {formatAddress(customer) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {formatAddress(customer)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Quote Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quote Items</h3>
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/50">
                    <TableHead className="font-medium text-sm text-foreground">Item</TableHead>
                    <TableHead className="font-medium text-sm text-foreground">Duration</TableHead>
                    <TableHead className="font-medium text-sm text-foreground text-right">Qty</TableHead>
                    <TableHead className="font-medium text-sm text-foreground text-right">Unit Price</TableHead>
                    <TableHead className="font-medium text-sm text-foreground text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.quote_items?.map((item: any) => (
                    <TableRow key={item.id} className="border-b border-border">
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm text-foreground">{item.product_name}</div>
                          {item.variation_name && (
                            <div className="text-xs text-muted-foreground">{item.variation_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.rental_duration_days} day{item.rental_duration_days !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="text-sm text-foreground text-right">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-foreground text-right">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground text-right">
                        {formatCurrency(item.line_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Quote Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              {quote.subtotal && quote.subtotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="text-sm font-medium">{formatCurrency(quote.subtotal)}</span>
                </div>
              )}
              {quote.discount_value && quote.discount_value > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Discount ({quote.discount_type === 'percentage' ? `${quote.discount_value}%` : formatCurrency(quote.discount_value)}):
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(quote.discount_type === 'percentage' 
                      ? (quote.subtotal * quote.discount_value / 100) 
                      : quote.discount_value)}
                  </span>
                </div>
              )}
              {quote.tax_amount && quote.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax:</span>
                  <span className="text-sm font-medium">{formatCurrency(quote.tax_amount)}</span>
                </div>
              )}
              {quote.additional_fees && quote.additional_fees > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Additional Fees:</span>
                  <span className="text-sm font-medium">{formatCurrency(quote.additional_fees)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-base font-semibold">Total:</span>
                <span className="text-base font-bold text-primary">{formatCurrency(quote.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Notes</h3>
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </div>
            </>
          )}

          {/* Terms */}
          {quote.terms && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground">{quote.terms}</p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <Separator />
          <div className="flex justify-between">
            <div>
              {(customer?.email || customer?.phone) && (
                <Button 
                  onClick={handleSendOption}
                  disabled={sendQuoteEmail.isPending}
                  variant="outline" 
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Resend Quote
                </Button>
              )}
            </div>
            
            {quote.status !== 'accepted' && quote.status !== 'rejected' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => updateQuoteStatus.mutate('rejected')}
                  disabled={updateQuoteStatus.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline Quote
                </Button>
                <Button
                  onClick={() => updateQuoteStatus.mutate('accepted')}
                  disabled={updateQuoteStatus.isPending}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve Quote
                </Button>
              </div>
            )}
          </div>

          {/* Contact Edit Modal */}
          {showContactEdit && (
            <Dialog open={showContactEdit} onOpenChange={setShowContactEdit}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Quote {quote.quote_number}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Review and confirm the contact information before sending the quote.
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={contactData.name}
                      onChange={(e) => setContactData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-3 pt-4">
                    <Label>How would you like to send the quote?</Label>
                    <div className="flex flex-col gap-2">
                      {contactData.email && (
                        <Button
                          onClick={() => handleSendWithEditedContact('email')}
                          disabled={sendQuoteEmail.isPending}
                          className="justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send via Email
                        </Button>
                      )}
                      {contactData.phone && (
                        <Button
                          onClick={() => handleSendWithEditedContact('sms')}
                          disabled={sendQuoteEmail.isPending}
                          className="justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send via SMS
                        </Button>
                      )}
                      {contactData.email && contactData.phone && (
                        <Button
                          onClick={() => handleSendWithEditedContact('both')}
                          disabled={sendQuoteEmail.isPending}
                          className="justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send via Email & SMS
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowContactEdit(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};