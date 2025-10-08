import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddFuelSupplier } from '@/hooks/useFuelSuppliers';
import { useForm } from 'react-hook-form';

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupplierFormData {
  supplier_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  payment_terms: string;
  notes: string;
}

export const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<SupplierFormData>({
    defaultValues: {
      payment_terms: 'Net-30',
    },
  });
  
  const addSupplier = useAddFuelSupplier();
  const paymentTerms = watch('payment_terms');

  const onSubmit = async (data: SupplierFormData) => {
    await addSupplier.mutateAsync({
      supplier_name: data.supplier_name,
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
      payment_terms: data.payment_terms,
      notes: data.notes,
      is_active: true,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Fuel Supplier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier_name">Supplier Name *</Label>
            <Input
              id="supplier_name"
              {...register('supplier_name', { required: true })}
              placeholder="e.g., ABC Fuel Supply"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Person</Label>
              <Input
                id="contact_name"
                {...register('contact_name')}
                placeholder="Contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                {...register('contact_phone')}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              placeholder="contact@supplier.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Default Payment Terms</Label>
            <Select
              value={paymentTerms}
              onValueChange={(value) => setValue('payment_terms', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="Net-30">Net-30</SelectItem>
                <SelectItem value="Net-15">Net-15</SelectItem>
                <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                <SelectItem value="COD">COD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Supplier notes, preferences, or special instructions..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addSupplier.isPending}>
              {addSupplier.isPending ? 'Adding...' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
