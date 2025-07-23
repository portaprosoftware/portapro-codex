import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, FileText, Send, Save } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuoteItem {
  id: string;
  type: 'inventory' | 'service';
  product_id?: string;
  service_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  rental_start_date?: Date;
  rental_end_date?: Date;
  service_frequency?: string;
  notes?: string;
}

const steps = [
  { id: 1, title: 'Customer & Basic Info', description: 'Select customer and quote details' },
  { id: 2, title: 'Add Items & Services', description: 'Add inventory items and services' },
  { id: 3, title: 'Pricing & Terms', description: 'Set pricing, discounts, and terms' },
  { id: 4, title: 'Review & Send', description: 'Review and send the quote' }
];

export function QuoteCreationWizard({ isOpen, onClose }: QuoteCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState({
    customer_id: '',
    quote_number: '',
    expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    notes: '',
    terms: 'Payment due within 7 days of acceptance.',
    discount_type: 'percentage',
    discount_value: 0,
    additional_fees: 0,
    status: 'draft'
  });
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [newItem, setNewItem] = useState({
    type: 'inventory' as 'inventory' | 'service',
    product_id: '',
    service_id: '',
    quantity: 1,
    unit_price: 0,
    rental_start_date: new Date(),
    rental_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    service_frequency: 'weekly',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch customers (simplified for now)
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .order('created_at');
      if (error) throw error;
      return data;
    }
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, default_price_per_day')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_maintenance_services')
        .select('id, name, per_visit_cost, per_hour_cost, flat_rate_cost')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Get next quote number
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
  });

  React.useEffect(() => {
    if (companySettings && !quoteData.quote_number) {
      const nextNumber = companySettings.next_quote_number || 1;
      const prefix = companySettings.quote_number_prefix || 'Q';
      setQuoteData(prev => ({
        ...prev,
        quote_number: `${prefix}${nextNumber.toString().padStart(4, '0')}`
      }));
    }
  }, [companySettings, quoteData.quote_number]);

  const createQuoteMutation = useMutation({
    mutationFn: async (status: 'draft' | 'sent') => {
      // Calculate totals
      const subtotal = quoteItems.reduce((sum, item) => sum + item.line_total, 0);
      const discountAmount = quoteData.discount_type === 'percentage' 
        ? (subtotal * quoteData.discount_value / 100)
        : quoteData.discount_value;
      const tax_amount = (subtotal - discountAmount + quoteData.additional_fees) * 0.08; // 8% tax
      const total_amount = subtotal - discountAmount + quoteData.additional_fees + tax_amount;

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_id: quoteData.customer_id,
          quote_number: quoteData.quote_number,
          expiration_date: quoteData.expiration_date.toISOString().split('T')[0],
          notes: quoteData.notes,
          terms: quoteData.terms,
          discount_type: quoteData.discount_type,
          status,
          subtotal,
          discount_value: discountAmount,
          tax_amount,
          total_amount,
          additional_fees: quoteData.additional_fees,
          sent_at: status === 'sent' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const itemsToInsert = quoteItems.map(item => ({
        quote_id: quote.id,
        product_id: item.product_id || null,
        service_id: item.service_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        rental_start_date: item.rental_start_date?.toISOString().split('T')[0] || null,
        rental_end_date: item.rental_end_date?.toISOString().split('T')[0] || null,
        service_frequency: item.service_frequency || null,
        line_item_type: item.type,
        service_notes: item.notes || null
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update next quote number
      await supabase
        .from('company_settings')
        .update({ 
          next_quote_number: (companySettings?.next_quote_number || 1) + 1 
        })
        .eq('id', companySettings?.id);

      return quote;
    },
    onSuccess: (data, status) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-metrics'] });
      toast.success(`Quote ${status === 'draft' ? 'saved as draft' : 'sent'} successfully!`);
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create quote: ' + error.message);
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

    const item: QuoteItem = {
      id: Date.now().toString(),
      type: newItem.type,
      product_id: newItem.product_id || undefined,
      service_id: newItem.service_id || undefined,
      product_name: productName,
      quantity: newItem.quantity,
      unit_price: unitPrice,
      line_total: unitPrice * newItem.quantity,
      rental_start_date: newItem.type === 'inventory' ? newItem.rental_start_date : undefined,
      rental_end_date: newItem.type === 'inventory' ? newItem.rental_end_date : undefined,
      service_frequency: newItem.type === 'service' ? newItem.service_frequency : undefined,
      notes: newItem.notes
    };

    setQuoteItems(prev => [...prev, item]);
    setNewItem({
      type: 'inventory',
      product_id: '',
      service_id: '',
      quantity: 1,
      unit_price: 0,
      rental_start_date: new Date(),
      rental_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      service_frequency: 'weekly',
      notes: ''
    });
  };

  const removeItem = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  };

  const resetForm = () => {
    setCurrentStep(1);
    setQuoteData({
      customer_id: '',
      quote_number: '',
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: '',
      terms: 'Payment due within 7 days of acceptance.',
      discount_type: 'percentage',
      discount_value: 0,
      additional_fees: 0,
      status: 'draft'
    });
    setQuoteItems([]);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return quoteData.customer_id && quoteData.quote_number;
      case 2:
        return quoteItems.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const subtotal = quoteItems.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = quoteData.discount_type === 'percentage' 
    ? (subtotal * quoteData.discount_value / 100)
    : quoteData.discount_value;
  const taxAmount = (subtotal - discountAmount + quoteData.additional_fees) * 0.08;
  const totalAmount = subtotal - discountAmount + quoteData.additional_fees + taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Steps Navigation */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.id}
                </div>
                <div className="ml-3 min-w-0">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer & Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer *</Label>
                    <Select 
                      value={quoteData.customer_id} 
                      onValueChange={(value) => setQuoteData(prev => ({ ...prev, customer_id: value }))}
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
                    <Label>Quote Number *</Label>
                    <Input
                      value={quoteData.quote_number}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, quote_number: e.target.value }))}
                      placeholder="Quote number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(quoteData.expiration_date, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={quoteData.expiration_date}
                          onSelect={(date) => date && setQuoteData(prev => ({ ...prev, expiration_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={quoteData.notes}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Internal notes about this quote..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
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

              {quoteItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Items ({quoteItems.length})</CardTitle>
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
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quoteItems.map((item) => (
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select 
                      value={quoteData.discount_type} 
                      onValueChange={(value) => setQuoteData(prev => ({ ...prev, discount_type: value }))}
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
                      value={quoteData.discount_value}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Fees</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quoteData.additional_fees}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, additional_fees: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={quoteData.terms}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, terms: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Quote Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Quote Summary</h3>
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
                    <span>{formatCurrency(quoteData.additional_fees)}</span>
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
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Send Quote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Customer</h4>
                    <p>Customer {quoteData.customer_id.substring(0, 8)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Quote Number</h4>
                    <p>{quoteData.quote_number}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Expiration Date</h4>
                    <p>{format(quoteData.expiration_date, 'PPP')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Total Amount</h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Items ({quoteItems.length})</h4>
                  <div className="mt-2 space-y-1">
                    {quoteItems.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.product_name} (x{item.quantity})</span>
                        <span>{formatCurrency(item.line_total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="space-x-2">
              {currentStep === 4 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => createQuoteMutation.mutate('draft')}
                    disabled={createQuoteMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => createQuoteMutation.mutate('sent')}
                    disabled={createQuoteMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Quote
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}