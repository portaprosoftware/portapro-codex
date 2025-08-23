import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit3, Save, DollarSign, Calendar, FileText } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

interface InvoiceFormData {
  amount: number;
  due_date: string;
  status: string;
  notes: string;
  subtotal: number;
  tax_amount: number;
  additional_fees: number;
  discount_value: number;
  discount_type: string;
}

export function EditInvoiceModal({ isOpen, onClose, invoice }: EditInvoiceModalProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    amount: 0,
    due_date: '',
    status: 'unpaid',
    notes: '',
    subtotal: 0,
    tax_amount: 0,
    additional_fees: 0,
    discount_value: 0,
    discount_type: 'percentage'
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (invoice) {
      setFormData({
        amount: invoice.amount || 0,
        due_date: invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : '',
        status: invoice.status || 'unpaid',
        notes: invoice.notes || '',
        subtotal: invoice.subtotal || 0,
        tax_amount: invoice.tax_amount || 0,
        additional_fees: invoice.additional_fees || 0,
        discount_value: invoice.discount_value || 0,
        discount_type: invoice.discount_type || 'percentage'
      });
    }
  }, [invoice]);

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          amount: data.amount,
          due_date: data.due_date,
          status: data.status,
          notes: data.notes,
          subtotal: data.subtotal,
          tax_amount: data.tax_amount,
          additional_fees: data.additional_fees,
          discount_value: data.discount_value,
          discount_type: data.discount_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Invoice updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to update invoice: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast.error('Invoice amount must be greater than 0');
      return;
    }

    updateInvoiceMutation.mutate(formData);
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
            <Edit3 className="h-6 w-6 text-blue-600" />
            Edit Invoice
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Invoice Information</h3>
              {getStatusBadge(formData.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Invoice #:</span>
                <span className="font-mono">{invoice.invoice_number}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Customer:</span>
                <span>{invoice.customers?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">Invoice Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-base font-semibold">Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subtotal */}
            <div className="space-y-2">
              <Label htmlFor="subtotal" className="text-base font-semibold">Subtotal</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Tax Amount */}
            <div className="space-y-2">
              <Label htmlFor="tax_amount" className="text-base font-semibold">Tax Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tax_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Additional Fees */}
            <div className="space-y-2">
              <Label htmlFor="additional_fees" className="text-base font-semibold">Additional Fees</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="additional_fees"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.additional_fees}
                  onChange={(e) => setFormData({ ...formData, additional_fees: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="space-y-4">
            <h4 className="font-semibold">Discount</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Discount Type</Label>
                <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
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
                <Label htmlFor="discount_value" className="text-base font-semibold">Discount Value</Label>
                <div className="relative">
                  {formData.discount_type === 'fixed' ? (
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                  )}
                  <Input
                    id="discount_value"
                    type="number"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notes <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this invoice..."
              rows={3}
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
              type="submit"
              disabled={updateInvoiceMutation.isPending || formData.amount <= 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateInvoiceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}