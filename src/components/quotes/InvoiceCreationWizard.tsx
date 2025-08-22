import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  fromQuoteId?: string;
  fromJobId?: string;
}

interface InvoiceItem {
  id: string;
  type: 'inventory' | 'service';
  product_id?: string;
  service_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  service_frequency?: string;
  notes?: string;
}

type Customer = { id: string };
type Product = { id: string; name: string; default_price_per_day: number };
type Service = { id: string; name: string; per_visit_cost: number | null; per_hour_cost: number | null; flat_rate_cost: number | null };

export function InvoiceCreationWizard({ isOpen, onClose, fromQuoteId, fromJobId }: InvoiceCreationWizardProps) {
  const [invoiceData, setInvoiceData] = useState({
    customer_id: '',
    invoice_number: '',
    due_date: addDays(new Date(), 30),
    quote_id: fromQuoteId || '',
    notes: '',
    terms: 'Payment due within 30 days.',
    discount_type: 'percentage',
    discount_value: 0,
    additional_fees: 0,
    status: 'unpaid'
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    type: 'inventory' as 'inventory' | 'service',
    product_id: '',
    service_id: '',
    quantity: 1,
    unit_price: 0,
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-simple'],
    queryFn: async () => {
      return [] as Customer[];
    }
  });

  // Fetch products  
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return [] as Product[];
    }
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      return [] as Service[];
    }
  });

  // Get next invoice number
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      try {
        const response = await supabase
          .from('company_settings')
          .select('*')
          .single();
        
        if (response.error) throw response.error;
        return response.data;
      } catch (error) {
        console.error('Error fetching company settings:', error);
        return null;
      }
    }
  });

  // Fetch quote if fromQuoteId is provided
  const { data: sourceQuote } = useQuery({
    queryKey: ['quote', fromQuoteId],
    queryFn: async () => {
      if (!fromQuoteId) return null;
      
      try {
        const quoteResponse = await supabase
          .from('quotes')
          .select('*')
          .eq('id', fromQuoteId)
          .single();
        
        if (quoteResponse.error) throw quoteResponse.error;

        const itemsResponse = await supabase
          .from('quote_items')
          .select('*')
          .eq('quote_id', fromQuoteId);

        if (itemsResponse.error) throw itemsResponse.error;

        return { quote: quoteResponse.data, items: itemsResponse.data };
      } catch (error) {
        console.error('Error fetching quote:', error);
        return null;
      }
    },
    enabled: !!fromQuoteId
  });

  // Fetch job if fromJobId is provided
  const { data: sourceJob } = useQuery({
    queryKey: ['job', fromJobId],
    queryFn: async () => {
      if (!fromJobId) return null;
      
      try {
        const jobResponse = await supabase
          .from('jobs')
          .select('*')
          .eq('id', fromJobId)
          .single();
        
        if (jobResponse.error) throw jobResponse.error;

        const itemsResponse = await supabase
          .from('job_items')
          .select('*')
          .eq('job_id', fromJobId);

        if (itemsResponse.error) throw itemsResponse.error;

        return { job: jobResponse.data, items: itemsResponse.data };
      } catch (error) {
        console.error('Error fetching job:', error);
        return null;
      }
    },
    enabled: !!fromJobId
  });

  useEffect(() => {
    if (companySettings && !invoiceData.invoice_number) {
      const nextNumber = companySettings.next_invoice_number || 1;
      const prefix = companySettings.invoice_number_prefix || 'INV';
      setInvoiceData(prev => ({
        ...prev,
        invoice_number: `${prefix}${nextNumber.toString().padStart(4, '0')}`
      }));
    }
  }, [companySettings, invoiceData.invoice_number]);

  useEffect(() => {
    if (sourceQuote) {
      setInvoiceData(prev => ({
        ...prev,
        customer_id: sourceQuote.quote.customer_id,
        quote_id: sourceQuote.quote.id,
        discount_type: sourceQuote.quote.discount_type || 'percentage',
        discount_value: sourceQuote.quote.discount_value || 0,
        additional_fees: sourceQuote.quote.additional_fees || 0,
        terms: sourceQuote.quote.terms || 'Payment due within 30 days.',
        notes: sourceQuote.quote.notes || ''
      }));

      const items = sourceQuote.items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        type: item.line_item_type as 'inventory' | 'service',
        product_id: item.product_id || undefined,
        service_id: item.service_id || undefined,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        service_frequency: item.service_frequency || undefined,
        notes: item.service_notes || undefined
      }));
      setInvoiceItems(items);
    }
  }, [sourceQuote]);

  // Handle job data prefilling
  useEffect(() => {
    if (sourceJob) {
      setInvoiceData(prev => ({
        ...prev,
        customer_id: sourceJob.job.customer_id,
        notes: `Invoice for Job: ${sourceJob.job.job_number || fromJobId}`
      }));

      // Convert job items to invoice format
      const items = sourceJob.items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        type: item.line_item_type as 'inventory' | 'service',
        product_id: item.product_id || undefined,
        service_id: item.service_id || undefined,
        product_name: item.line_item_type === 'inventory' ? 'Product' : 'Service',
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.total_price,
        service_frequency: item.service_frequency || undefined,
        notes: undefined
      }));
      setInvoiceItems(items);
    }
  }, [sourceJob]);

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.line_total, 0);
      const discountAmount = invoiceData.discount_type === 'percentage' 
        ? (subtotal * invoiceData.discount_value / 100)
        : invoiceData.discount_value;
      const tax_amount = (subtotal - discountAmount + invoiceData.additional_fees) * 0.08;
      const amount = subtotal - discountAmount + invoiceData.additional_fees + tax_amount;

      const invoiceResponse = await supabase
        .from('invoices')
        .insert({
          customer_id: invoiceData.customer_id,
          invoice_number: invoiceData.invoice_number,
          due_date: invoiceData.due_date.toISOString().split('T')[0],
          quote_id: invoiceData.quote_id || null,
          job_id: fromJobId || null,
          notes: invoiceData.notes,
          terms: invoiceData.terms,
          discount_type: invoiceData.discount_type,
          status: invoiceData.status,
          subtotal,
          discount_value: discountAmount,
          tax_amount,
          amount,
          additional_fees: invoiceData.additional_fees
        })
        .select()
        .single();

      if (invoiceResponse.error) throw invoiceResponse.error;

      const itemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoiceResponse.data.id,
        product_id: item.product_id || null,
        service_id: item.service_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        line_item_type: item.type,
        service_frequency: item.service_frequency || null,
        service_notes: item.notes || null
      }));

      const itemsResponse = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsResponse.error) throw itemsResponse.error;

      if (companySettings?.id) {
        await supabase
          .from('company_settings')
          .update({ 
            next_invoice_number: (companySettings?.next_invoice_number || 1) + 1 
          })
          .eq('id', companySettings.id);
      }

      return invoiceResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-metrics'] });
      toast.success('Invoice created successfully!');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create invoice: ' + error.message);
    }
  });

  const addItem = () => {
    if (!newItem.product_id && !newItem.service_id) {
      toast.error('Please select a product or service');
      return;
    }

    let productName = '';
    let unitPrice = newItem.unit_price;

    if (newItem.type === 'inventory' && newItem.product_id) {
      const product = products.find(p => p.id === newItem.product_id);
      productName = product?.name || '';
      unitPrice = product?.default_price_per_day || 0;
    } else if (newItem.type === 'service' && newItem.service_id) {
      const service = services.find(s => s.id === newItem.service_id);
      productName = service?.name || '';
      unitPrice = service?.per_visit_cost || service?.per_hour_cost || service?.flat_rate_cost || 0;
    }

    const item: InvoiceItem = {
      id: Date.now().toString(),
      type: newItem.type,
      product_id: newItem.product_id || undefined,
      service_id: newItem.service_id || undefined,
      product_name: productName,
      quantity: newItem.quantity,
      unit_price: unitPrice,
      line_total: unitPrice * newItem.quantity,
      notes: newItem.notes
    };

    setInvoiceItems(prev => [...prev, item]);
    setNewItem({
      type: 'inventory',
      product_id: '',
      service_id: '',
      quantity: 1,
      unit_price: 0,
      notes: ''
    });
  };

  const removeItem = (itemId: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== itemId));
  };

  const resetForm = () => {
    setInvoiceData({
      customer_id: '',
      invoice_number: '',
      due_date: addDays(new Date(), 30),
      quote_id: fromQuoteId || '',
      notes: '',
      terms: 'Payment due within 30 days.',
      discount_type: 'percentage',
      discount_value: 0,
      additional_fees: 0,
      status: 'unpaid'
    });
    setInvoiceItems([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = invoiceData.discount_type === 'percentage' 
    ? (subtotal * invoiceData.discount_value / 100)
    : invoiceData.discount_value;
  const taxAmount = (subtotal - discountAmount + invoiceData.additional_fees) * 0.08;
  const totalAmount = subtotal - discountAmount + invoiceData.additional_fees + taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create New Invoice
            {fromQuoteId && <Badge variant="secondary">From Quote</Badge>}
            {fromJobId && <Badge variant="secondary">From Job</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select 
                    value={invoiceData.customer_id} 
                    onValueChange={(value) => setInvoiceData(prev => ({ ...prev, customer_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          Customer {customer.id.substring(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Invoice Number *</Label>
                  <Input
                    value={invoiceData.invoice_number}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                    placeholder="Invoice number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(invoiceData.due_date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={invoiceData.due_date}
                        onSelect={(date) => date && setInvoiceData(prev => ({ ...prev, due_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select 
                    value={invoiceData.terms.includes('30') ? '30' : invoiceData.terms.includes('15') ? '15' : '7'} 
                    onValueChange={(value) => setInvoiceData(prev => ({ 
                      ...prev, 
                      terms: `Payment due within ${value} days.`,
                      due_date: addDays(new Date(), parseInt(value))
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Net 7</SelectItem>
                      <SelectItem value="15">Net 15</SelectItem>
                      <SelectItem value="30">Net 30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes about this invoice..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {!fromQuoteId && !fromJobId && (
            <Card>
              <CardHeader>
                <CardTitle>Add Items & Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newItem.type} 
                      onValueChange={(value: 'inventory' | 'service') => setNewItem(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory">Inventory Item</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newItem.type === 'inventory' ? (
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select 
                        value={newItem.product_id} 
                        onValueChange={(value) => setNewItem(prev => ({ ...prev, product_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.default_price_per_day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Service</Label>
                      <Select 
                        value={newItem.service_id} 
                        onValueChange={(value) => setNewItem(prev => ({ ...prev, service_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - {formatCurrency(service.per_visit_cost || service.per_hour_cost || service.flat_rate_cost || 0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <Button onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          )}

          {invoiceItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items ({invoiceItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      {!fromQuoteId && !fromJobId && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'inventory' ? 'default' : 'secondary'}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(item.line_total)}</TableCell>
                        {!fromQuoteId && !fromJobId && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select 
                    value={invoiceData.discount_type} 
                    onValueChange={(value) => setInvoiceData(prev => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={invoiceData.discount_value}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Fees</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={invoiceData.additional_fees}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, additional_fees: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Invoice Summary</h3>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Fees:</span>
                  <span>{formatCurrency(invoiceData.additional_fees)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => createInvoiceMutation.mutate()}
              disabled={createInvoiceMutation.isPending || !invoiceData.customer_id || !invoiceData.invoice_number || invoiceItems.length === 0}
              className="btn-primary"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}