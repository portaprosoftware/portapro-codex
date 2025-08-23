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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Receipt, ChevronDown, ChevronUp, FileText, Eye, Send, Download, Save } from 'lucide-react';
import { useTaxRate } from '@/hooks/useTaxRate';
import { toast } from 'sonner';

interface EnhancedInvoiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  fromQuoteId?: string;
  fromJobId?: string;
}

interface InvoiceItem {
  id: string;
  type: 'inventory' | 'service' | 'fee' | 'discount';
  product_id?: string;
  service_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit_of_measure: string;
  line_total: number;
  service_frequency?: string;
  notes?: string;
}

interface InvoiceFormData {
  customer_id: string;
  invoice_number: string;
  due_date: Date;
  quote_id?: string;
  job_id?: string;
  notes: string;
  internal_notes: string;
  terms: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  apply_discount_to: 'total' | 'individual';
  additional_fees: number;
  additional_fees_description: string;
  tax_rate: number;
  tax_per_line: boolean;
  status: string;
  recurring: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'yearly';
}

type Customer = { id: string; name: string; email?: string; service_zip?: string | null; default_service_zip?: string | null; billing_zip?: string | null; service_state?: string | null; default_service_state?: string | null; billing_state?: string | null; tax_rate_override?: number | null; };
type Product = { id: string; name: string; default_price_per_day: number };
type Service = { id: string; name: string };

export function EnhancedInvoiceWizard({ isOpen, onClose, fromQuoteId, fromJobId }: EnhancedInvoiceWizardProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    customer_id: '',
    invoice_number: '',
    due_date: addDays(new Date(), 30),
    quote_id: fromQuoteId || '',
    job_id: fromJobId || '',
    notes: '',
    internal_notes: '',
    terms: 'Payment due within 30 days.',
    discount_type: 'percentage',
    discount_value: 0,
    apply_discount_to: 'total',
    additional_fees: 0,
    additional_fees_description: '',
    tax_rate: 8.0,
    tax_per_line: false,
    status: 'unpaid',
    recurring: false
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    type: 'inventory' as 'inventory' | 'service' | 'fee' | 'discount',
    product_id: '',
    service_id: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    unit_of_measure: 'each',
    notes: ''
  });

  // Collapsible sections state
  const [sectionsOpen, setSectionsOpen] = useState({
    information: true,
    items: true,
    pricing: true
  });

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, billing_address, billing_city, billing_state, billing_zip, service_zip, default_service_zip, billing_zip, service_state, default_service_state, billing_state, tax_rate_override')
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    }
  });

  // Fetch products  
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, default_price_per_day')
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    }
  });

  // Get next invoice number
  const { data: nextInvoiceNumber } = useQuery({
    queryKey: ['next-invoice-number'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_next_invoice_number');
      if (error) throw error;
      return data as string;
    }
  });

  // Fetch source data (quote or job)
  const { data: sourceData } = useQuery({
    queryKey: ['invoice-source', fromQuoteId || fromJobId],
    queryFn: async () => {
      if (fromQuoteId) {
        const [quoteResponse, itemsResponse] = await Promise.all([
          supabase.from('quotes').select('*').eq('id', fromQuoteId).single(),
          supabase.from('quote_items').select('*').eq('quote_id', fromQuoteId)
        ]);
        
        if (quoteResponse.error) throw quoteResponse.error;
        if (itemsResponse.error) throw itemsResponse.error;
        
        return { source: 'quote', data: quoteResponse.data, items: itemsResponse.data };
      } else if (fromJobId) {
        const [jobResponse, itemsResponse] = await Promise.all([
          supabase.from('jobs').select('*').eq('id', fromJobId).single(),
          supabase.from('job_items').select('*').eq('job_id', fromJobId)
        ]);
        
        if (jobResponse.error) throw jobResponse.error;
        if (itemsResponse.error) throw itemsResponse.error;
        
        return { source: 'job', data: jobResponse.data, items: itemsResponse.data };
      }
      return null;
    },
    enabled: !!(fromQuoteId || fromJobId)
  });

  // Set initial invoice number
  useEffect(() => {
    if (nextInvoiceNumber && !invoiceData.invoice_number) {
      setInvoiceData(prev => ({
        ...prev,
        invoice_number: nextInvoiceNumber
      }));
    }
  }, [nextInvoiceNumber, invoiceData.invoice_number]);


  // Handle source data prefilling
  useEffect(() => {
    if (sourceData) {
      const sourceObj = sourceData.data as any;
      setInvoiceData(prev => ({
        ...prev,
        customer_id: sourceObj.customer_id,
        discount_type: sourceObj.discount_type || 'percentage',
        discount_value: sourceObj.discount_value || 0,
        additional_fees: sourceObj.additional_fees || 0,
        terms: sourceObj.terms || 'Payment due within 30 days.',
        notes: sourceData.source === 'quote' 
          ? `Generated from Quote: ${sourceObj.quote_number || fromQuoteId}`
          : `Generated from Job: ${sourceObj.job_number || fromJobId}`
      }));

      // Convert source items to invoice format
      const items = sourceData.items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        type: item.line_item_type as 'inventory' | 'service',
        product_id: item.product_id || undefined,
        service_id: item.service_id || undefined,
        product_name: item.product_name || (item.line_item_type === 'inventory' ? 'Product' : 'Service'),
        description: item.description || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_of_measure: item.unit_of_measure || 'each',
        line_total: item.line_total || item.total_price,
        service_frequency: item.service_frequency || undefined,
        notes: item.service_notes || item.notes || undefined
      }));
      setInvoiceItems(items);
    }
  }, [sourceData, fromQuoteId, fromJobId]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (actionType: 'save_draft' | 'send' | 'download') => {
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.line_total, 0);
      const discountAmount = invoiceData.discount_type === 'percentage' 
        ? (subtotal * invoiceData.discount_value / 100)
        : invoiceData.discount_value;
      const taxableAmount = subtotal - discountAmount + invoiceData.additional_fees;
      const tax_amount = taxableAmount * (invoiceData.tax_rate / 100);
      const amount = taxableAmount + tax_amount;

      const invoiceResponse = await supabase
        .from('invoices')
        .insert({
          customer_id: invoiceData.customer_id,
          invoice_number: invoiceData.invoice_number,
          due_date: invoiceData.due_date.toISOString().split('T')[0],
          quote_id: invoiceData.quote_id || null,
          job_id: invoiceData.job_id || null,
          notes: invoiceData.notes,
          terms: invoiceData.terms,
          discount_type: invoiceData.discount_type,
          status: actionType === 'save_draft' ? 'draft' : invoiceData.status,
          subtotal,
          discount_value: discountAmount,
          tax_amount,
          amount,
          additional_fees: invoiceData.additional_fees
        })
        .select()
        .single();

      if (invoiceResponse.error) throw invoiceResponse.error;

      // Insert invoice items
      const itemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoiceResponse.data.id,
        product_id: item.product_id || null,
        service_id: item.service_id || null,
        product_name: item.product_name,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_of_measure: item.unit_of_measure,
        line_total: item.line_total,
        line_item_type: item.type,
        service_frequency: item.service_frequency || null,
        service_notes: item.notes || null
      }));

      if (itemsToInsert.length > 0) {
        const itemsResponse = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsResponse.error) throw itemsResponse.error;
      }

      return { invoice: invoiceResponse.data, actionType };
    },
    onSuccess: ({ invoice, actionType }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-metrics'] });
      
      if (actionType === 'save_draft') {
        toast.success('Invoice saved as draft!');
      } else if (actionType === 'send') {
        toast.success('Invoice created and sent successfully!');
      } else if (actionType === 'download') {
        toast.success('Invoice created and downloaded!');
      }
      
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create invoice: ' + error.message);
    }
  });

  const addItem = () => {
    if (newItem.type === 'inventory' && !newItem.product_id) {
      toast.error('Please select a product');
      return;
    }
    if (newItem.type === 'service' && !newItem.service_id) {
      toast.error('Please select a service');
      return;
    }
    if ((newItem.type === 'fee' || newItem.type === 'discount') && !newItem.description) {
      toast.error('Please provide a description');
      return;
    }

    let productName = '';
    let unitPrice = newItem.unit_price;
    let unitOfMeasure = newItem.unit_of_measure;

    if (newItem.type === 'inventory' && newItem.product_id) {
      const product = products.find(p => p.id === newItem.product_id);
      productName = product?.name || '';
      unitPrice = product?.default_price_per_day || 0;
      unitOfMeasure = newItem.unit_of_measure || 'each';
    } else if (newItem.type === 'service' && newItem.service_id) {
      const service = services.find(s => s.id === newItem.service_id);
      productName = service?.name || '';
      unitPrice = 0; // Default to 0, user can edit
      unitOfMeasure = newItem.unit_of_measure || 'service';
    } else if (newItem.type === 'fee') {
      productName = newItem.description;
      unitPrice = newItem.unit_price;
      unitOfMeasure = newItem.unit_of_measure || 'each';
    } else if (newItem.type === 'discount') {
      productName = newItem.description;
      unitPrice = -Math.abs(newItem.unit_price); // Ensure discount is negative
      unitOfMeasure = newItem.unit_of_measure || 'each';
    }

    const item: InvoiceItem = {
      id: Date.now().toString(),
      type: newItem.type,
      product_id: newItem.product_id || undefined,
      service_id: newItem.service_id || undefined,
      product_name: productName,
      description: newItem.type === 'inventory' || newItem.type === 'service' ? newItem.description : undefined,
      quantity: newItem.quantity,
      unit_price: unitPrice,
      unit_of_measure: unitOfMeasure,
      line_total: unitPrice * newItem.quantity,
      notes: newItem.notes
    };

    setInvoiceItems(prev => [...prev, item]);
    setNewItem({
      type: 'inventory',
      product_id: '',
      service_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      unit_of_measure: 'each',
      notes: ''
    });
  };

  const removeItem = (itemId: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.line_total = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    }));
  };

  const resetForm = () => {
    setInvoiceData({
      customer_id: '',
      invoice_number: '',
      due_date: addDays(new Date(), 30),
      quote_id: fromQuoteId || '',
      job_id: fromJobId || '',
      notes: '',
      internal_notes: '',
      terms: 'Payment due within 30 days.',
      discount_type: 'percentage',
      discount_value: 0,
      apply_discount_to: 'total',
      additional_fees: 0,
      additional_fees_description: '',
      tax_rate: 8.0,
      tax_per_line: false,
      status: 'unpaid',
      recurring: false
    });
    setInvoiceItems([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculations
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = invoiceData.discount_type === 'percentage' 
    ? (subtotal * invoiceData.discount_value / 100)
    : invoiceData.discount_value;
  const taxableAmount = subtotal - discountAmount + invoiceData.additional_fees;
  const taxAmount = taxableAmount * (invoiceData.tax_rate / 100);
  const totalAmount = taxableAmount + taxAmount;

  const selectedCustomer = customers.find(c => c.id === invoiceData.customer_id);
  const derivedZip = selectedCustomer?.service_zip || selectedCustomer?.default_service_zip || selectedCustomer?.billing_zip;
  const derivedState = selectedCustomer?.service_state || selectedCustomer?.default_service_state || selectedCustomer?.billing_state;
  const { data: taxData } = useTaxRate({ 
    zip: derivedZip, 
    state: derivedState, 
    customerOverride: selectedCustomer?.tax_rate_override 
  });

  // Auto-apply tax rate from ZIP/state when customer changes
  useEffect(() => {
    if (taxData?.rate != null) {
      setInvoiceData(prev => ({ ...prev, tax_rate: Number((taxData.rate * 100).toFixed(4)) }));
    }
  }, [taxData?.rate, invoiceData.customer_id]);

  // Auto-fill customer details when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      // Auto-set payment terms based on company defaults if no specific customer default
      if (!invoiceData.terms || invoiceData.terms === 'Payment due within 30 days.') {
        // Could fetch from company settings or customer defaults in the future
        setInvoiceData(prev => ({ 
          ...prev, 
          terms: 'Payment due within 30 days.',
          due_date: addDays(new Date(), 30)
        }));
      }
    }
  }, [selectedCustomer]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create Enhanced Invoice
            {fromQuoteId && <Badge variant="secondary">From Quote</Badge>}
            {fromJobId && <Badge variant="secondary">From Job</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[calc(95vh-120px)]">
          {/* Left Panel - Form */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-4">
            {/* Invoice Information Section */}
            <Collapsible
              open={sectionsOpen.information}
              onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, information: open }))}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <CardTitle className="flex items-center justify-between">
                      <span>Invoice Information</span>
                      {sectionsOpen.information ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
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
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Invoice Number *</Label>
                        <div className="space-y-1">
                          <Input
                            value={invoiceData.invoice_number}
                            onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                            placeholder="Invoice number"
                          />
                          <p className="text-xs text-muted-foreground">
                            Next: {nextInvoiceNumber || 'Loading...'}
                          </p>
                        </div>
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
                        <div className="space-y-1">
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
                          <p className="text-xs text-muted-foreground">
                            {invoiceData.terms.includes('30') ? 'Net 30' : 
                             invoiceData.terms.includes('15') ? 'Net 15' : 'Net 7'} 
                            → Due {format(invoiceData.due_date, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Customer Notes (Public)</Label>
                        <Textarea
                          value={invoiceData.notes}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Notes visible to customer..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Internal Notes (Private)</Label>
                        <Textarea
                          value={invoiceData.internal_notes}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, internal_notes: e.target.value }))}
                          placeholder="Internal notes (not visible to customer)..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="recurring"
                        checked={invoiceData.recurring}
                        onCheckedChange={(checked) => setInvoiceData(prev => ({ ...prev, recurring: checked }))}
                      />
                      <Label htmlFor="recurring">Recurring Invoice</Label>
                      {invoiceData.recurring && (
                        <Select 
                          value={invoiceData.recurring_frequency} 
                          onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => 
                            setInvoiceData(prev => ({ ...prev, recurring_frequency: value }))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Items & Services Section */}
            <Collapsible
              open={sectionsOpen.items}
              onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, items: open }))}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <CardTitle className="flex items-center justify-between">
                      <span>Items & Services</span>
                      {sectionsOpen.items ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Add Item Form */}
                    <div className="grid grid-cols-6 gap-2 p-4 border rounded-lg">
                      <Select 
                        value={newItem.type} 
                        onValueChange={(value: 'inventory' | 'service' | 'fee' | 'discount') => 
                          setNewItem(prev => ({ ...prev, type: value, product_id: '', service_id: '' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inventory">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="fee">Fee</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                        </SelectContent>
                      </Select>

                      {newItem.type === 'inventory' ? (
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
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : newItem.type === 'service' ? (
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
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : newItem.type === 'fee' ? (
                        <Select 
                          value={newItem.description} 
                          onValueChange={(value) => {
                            const feeMap: Record<string, number> = {
                              'Delivery Fee': 50,
                              'Setup Fee': 75,
                              'Environmental Fee': 25,
                              'Custom': 0
                            };
                            setNewItem(prev => ({ 
                              ...prev, 
                              description: value,
                              unit_price: feeMap[value] || 0
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Delivery Fee">Delivery Fee ($50)</SelectItem>
                            <SelectItem value="Setup Fee">Setup Fee ($75)</SelectItem>
                            <SelectItem value="Environmental Fee">Environmental Fee ($25)</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Discount name"
                          value={newItem.description}
                          onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        />
                      )}

                      {newItem.type === 'fee' || newItem.type === 'discount' ? null : (
                        <Input
                          placeholder="Description"
                          value={newItem.description}
                          onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        />
                      )}

                      <Input
                        type="number"
                        placeholder="Qty"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      />

                      <Select 
                        value={newItem.unit_of_measure} 
                        onValueChange={(value) => setNewItem(prev => ({ ...prev, unit_of_measure: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="each">Each</SelectItem>
                          <SelectItem value="per day">Per Day</SelectItem>
                          <SelectItem value="per hour">Per Hour</SelectItem>
                          <SelectItem value="per mile">Per Mile</SelectItem>
                          <SelectItem value="per event">Per Event</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button onClick={addItem} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Items Table */}
                    {invoiceItems.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Product/Service</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Badge variant={
                                  item.type === 'inventory' ? 'default' : 
                                  item.type === 'service' ? 'secondary' :
                                  item.type === 'fee' ? 'outline' :
                                  'destructive'
                                }>
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>
                                <Input
                                  value={item.description || ''}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  placeholder="Description"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={item.unit_of_measure} 
                                  onValueChange={(value) => updateItem(item.id, 'unit_of_measure', value)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="each">Each</SelectItem>
                                    <SelectItem value="per day">Per Day</SelectItem>
                                    <SelectItem value="per hour">Per Hour</SelectItem>
                                    <SelectItem value="per mile">Per Mile</SelectItem>
                                    <SelectItem value="per event">Per Event</SelectItem>
                                    <SelectItem value="service">Service</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>{formatCurrency(item.line_total)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Pricing & Summary Section */}
            <Collapsible
              open={sectionsOpen.pricing}
              onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, pricing: open }))}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <CardTitle className="flex items-center justify-between">
                      <span>Pricing & Summary</span>
                      {sectionsOpen.pricing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select 
                          value={invoiceData.discount_type} 
                          onValueChange={(value: 'percentage' | 'flat') => 
                            setInvoiceData(prev => ({ ...prev, discount_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="flat">Flat Amount ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          step={invoiceData.discount_type === 'percentage' ? '0.1' : '0.01'}
                          value={invoiceData.discount_value}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Fees</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={invoiceData.additional_fees}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, additional_fees: Number(e.target.value) }))}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Fee Description</Label>
                        <Input
                          value={invoiceData.additional_fees_description}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, additional_fees_description: e.target.value }))}
                          placeholder="e.g., Delivery fee, Setup fee"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={invoiceData.tax_rate}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                          placeholder="8.0"
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {invoiceData.discount_value > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount ({invoiceData.discount_type === 'percentage' ? `${invoiceData.discount_value}%` : 'Flat'}):</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      {invoiceData.additional_fees > 0 && (
                        <div className="flex justify-between">
                          <span>Additional Fees:</span>
                          <span>{formatCurrency(invoiceData.additional_fees)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax ({invoiceData.tax_rate}%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-2xl font-bold text-primary bg-primary/10 p-3 rounded-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-96 bg-muted/30 rounded-lg p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <h3 className="font-semibold">Live Preview</h3>
              </div>
              
              <div className="bg-white p-6 rounded border shadow-sm space-y-4 text-sm">
                <div className="text-center">
                  <h2 className="text-xl font-bold">INVOICE</h2>
                  <p className="text-muted-foreground">{invoiceData.invoice_number}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Bill To:</h4>
                    <p>{selectedCustomer?.name || 'No customer selected'}</p>
                    {selectedCustomer?.email && <p className="text-muted-foreground">{selectedCustomer.email}</p>}
                  </div>
                  <div className="text-right">
                    <p><strong>Due Date:</strong> {format(invoiceData.due_date, 'PPP')}</p>
                    <p><strong>Terms:</strong> {invoiceData.terms}</p>
                  </div>
                </div>

                <Separator />

                {invoiceItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {invoiceItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            {item.description && <p className="text-muted-foreground">{item.description}</p>}
                            <p className="text-muted-foreground">{item.quantity} × {formatCurrency(item.unit_price)} {item.unit_of_measure}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(item.line_total)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {invoiceData.discount_value > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {invoiceData.additional_fees > 0 && (
                    <div className="flex justify-between">
                      <span>{invoiceData.additional_fees_description || 'Additional Fees'}:</span>
                      <span>{formatCurrency(invoiceData.additional_fees)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl pt-2 border-t bg-primary/10 p-2 rounded">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {invoiceData.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-1">Notes</h4>
                      <p className="text-xs text-muted-foreground">{invoiceData.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => createInvoiceMutation.mutate('save_draft')}
              disabled={createInvoiceMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              variant="outline"
              onClick={() => createInvoiceMutation.mutate('send')}
              disabled={createInvoiceMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
            <Button
              onClick={() => createInvoiceMutation.mutate('download')}
              disabled={createInvoiceMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Create & Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}