import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { X, Mail, Phone, MapPin, Calendar, DollarSign, FileText, User, Send, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
}

export const InvoiceDetailModal = ({ isOpen, onClose, invoiceId }: InvoiceDetailModalProps) => {
  const [showContactEdit, setShowContactEdit] = useState(false);
  const [contactData, setContactData] = useState({ email: '', phone: '', name: '' });
  const queryClient = useQueryClient();

  // Fetch invoice basic data
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice-details', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id (
            id,
            name,
            email,
            phone,
            billing_street,
            billing_street2,
            billing_city,
            billing_state,
            billing_zip,
            service_street,
            service_street2,
            service_city,
            service_state,
            service_zip
          ),
          jobs:job_id (
            id,
            job_number,
            job_type,
            scheduled_date
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!invoiceId,
  });

  // Fetch invoice items separately since the relationship might not exist
  const { data: invoiceItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['invoice-items', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('id, product_name, variation_name, quantity, unit_price, line_total, description')
        .eq('invoice_id', invoiceId);

      // Don't throw error if table doesn't exist or no items found
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw error;
      }
      return data || [];
    },
    enabled: isOpen && !!invoiceId,
  });

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async ({ sendMethod, customerEmail, customerPhone, customerName }: {
      sendMethod: 'email' | 'sms' | 'both';
      customerEmail?: string;
      customerPhone?: string;
      customerName: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoiceId,
          customerEmail,
          customerPhone,
          customerName,
          sendMethod
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      const method = variables.sendMethod === 'both' ? 'email and SMS' : variables.sendMethod;
      toast.success(`Invoice sent successfully via ${method}!`);
      queryClient.invalidateQueries({ queryKey: ['invoice-details', invoiceId] });
    },
    onError: (error: any) => {
      console.error('Send invoice error:', error);
      toast.error(`Failed to send invoice: ${error.message}`);
    }
  });

  const isLoading = invoiceLoading || itemsLoading;

  // Initialize contact data when invoice loads
  const customer = invoice?.customers;
  const defaultContactData = {
    email: customer?.email || '',
    phone: customer?.phone || '',
    name: customer?.name || ''
  };

  const handleSendOption = (method: 'email' | 'sms' | 'both') => {
    const currentData = {
      email: customer?.email || '',
      phone: customer?.phone || '',
      name: customer?.name || ''
    };
    
    setContactData(currentData);
    
    // Always show the contact edit modal for user to review/confirm contact info
    setShowContactEdit(true);
    
    // Store the selected method for later use
    (window as any).pendingSendMethod = method;
  };

  const handleSendWithEditedContact = (method: 'email' | 'sms' | 'both') => {
    sendInvoiceMutation.mutate({
      sendMethod: method,
      customerEmail: method !== 'sms' ? contactData.email : undefined,
      customerPhone: method !== 'email' ? contactData.phone : undefined,
      customerName: contactData.name
    });
    setShowContactEdit(false);
  };

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
      'paid': { 
        gradient: 'bg-gradient-to-r from-green-500 to-green-600', 
        label: 'Paid' 
      },
      'unpaid': { 
        gradient: 'bg-gradient-to-r from-red-500 to-red-600', 
        label: 'Unpaid' 
      },
      'overdue': { 
        gradient: 'bg-gradient-to-r from-orange-500 to-orange-600', 
        label: 'Overdue' 
      },
      'cancelled': { 
        gradient: 'bg-gradient-to-r from-gray-500 to-gray-600', 
        label: 'Cancelled' 
      },
      'partial': { 
        gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600', 
        label: 'Partial' 
      }
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

  const formatAddress = (customer: any, type: 'billing' | 'service') => {
    const prefix = type === 'billing' ? 'billing' : 'service';
    const street = customer[`${prefix}_street`];
    const street2 = customer[`${prefix}_street2`];
    const city = customer[`${prefix}_city`];
    const state = customer[`${prefix}_state`];
    const zip = customer[`${prefix}_zip`];

    if (!street && !city) return null;

    return (
      <div className="text-sm text-muted-foreground">
        {street && <div>{street}</div>}
        {street2 && <div>{street2}</div>}
        {(city || state || zip) && (
          <div>{[city, state, zip].filter(Boolean).join(', ')}</div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading invoice details...</div>
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Invoice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Invoice #:</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {invoice.invoice_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Created:</span>
                    <span className="text-muted-foreground">{formatDate(invoice.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Due Date:</span>
                    <span className="text-muted-foreground">{formatDate(invoice.due_date)}</span>
                  </div>
                  {invoice.jobs && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Job #:</span>
                      <span className="font-mono text-sm">{invoice.jobs.job_number}</span>
                    </div>
                  )}
                  {invoice.quote_id && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Quote ID:</span>
                      <span className="font-mono text-sm">{invoice.quote_id}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="font-medium text-lg">{invoice.customers?.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {invoice.customers?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {invoice.customers.email}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {invoice.customers?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {invoice.customers.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {formatAddress(invoice.customers, 'billing') && (
                    <div>
                      <div className="font-medium text-sm mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Billing Address:
                      </div>
                      {formatAddress(invoice.customers, 'billing')}
                    </div>
                  )}
                  
                  {formatAddress(invoice.customers, 'service') && (
                    <div>
                      <div className="font-medium text-sm mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Service Address:
                      </div>
                      {formatAddress(invoice.customers, 'service')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(invoiceItems) && invoiceItems.length > 0 ? (
                      invoiceItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              {item.variation_name && (
                                <div className="text-sm text-muted-foreground">{item.variation_name}</div>
                              )}
                              {item.description && (
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.line_total)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No line items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.subtotal && (
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                  )}
                  {invoice.discount_value && invoice.discount_value > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount ({invoice.discount_type === 'percentage' ? `${invoice.discount_value}%` : 'Fixed'}):
                      </span>
                      <span>-{formatCurrency(invoice.discount_value)}</span>
                    </div>
                  )}
                  {invoice.additional_fees && invoice.additional_fees > 0 && (
                    <div className="flex justify-between">
                      <span>Additional Fees:</span>
                      <span>{formatCurrency(invoice.additional_fees)}</span>
                    </div>
                  )}
                  {invoice.tax_amount && invoice.tax_amount > 0 && (
                    <div className="flex justify-between">
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
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoice.notes && (
                    <div>
                      <div className="font-medium mb-2">Notes:</div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <div className="font-medium mb-2">Terms:</div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Invoice not found
          </div>
        )}

        <div className="flex justify-between pt-4">
          {invoice?.status === 'unpaid' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-bold">
                  <Send className="w-4 h-4 mr-2" />
                  Send Invoice
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem 
                  onClick={() => handleSendOption('email')}
                  disabled={sendInvoiceMutation.isPending}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send via Email
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSendOption('sms')}
                  disabled={sendInvoiceMutation.isPending}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Send via SMS
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSendOption('both')}
                  disabled={sendInvoiceMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send via Both
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Contact Edit Modal */}
        {showContactEdit && (
          <Dialog open={showContactEdit} onOpenChange={setShowContactEdit}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Contact Information</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Customer Name</Label>
                  <Input
                    id="contact-name"
                    value={contactData.name}
                    onChange={(e) => setContactData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email Address</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowContactEdit(false)}>
                  Cancel
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                      Send Invoice
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSendWithEditedContact('email')}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send via Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendWithEditedContact('sms')}>
                      <Phone className="mr-2 h-4 w-4" />
                      Send via SMS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendWithEditedContact('both')}>
                      <Send className="mr-2 h-4 w-4" />
                      Send via Both
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};