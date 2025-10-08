import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FuelSupplier } from '@/types/fuel';
import { useUpdateFuelSupplier } from '@/hooks/useFuelSuppliers';
import { useForm } from 'react-hook-form';
import { Building2 } from 'lucide-react';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: FuelSupplier | null;
}

interface SupplierFormData {
  supplier_name: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
}

export const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const updateSupplier = useUpdateFuelSupplier();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormData>();

  const isActive = watch('is_active');

  useEffect(() => {
    if (supplier) {
      // Split contact_name into first and last if it exists
      const nameParts = supplier.contact_name?.trim().split(/\s+/) || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      reset({
        supplier_name: supplier.supplier_name,
        contact_first_name: firstName,
        contact_last_name: lastName,
        contact_phone: supplier.contact_phone || '',
        contact_email: supplier.contact_email || '',
        payment_terms: supplier.payment_terms || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active !== false,
      });
    }
  }, [supplier, reset]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const onSubmit = async (data: SupplierFormData) => {
    if (!supplier) return;

    // Combine first and last name into contact_name
    const contact_name = [data.contact_first_name?.trim(), data.contact_last_name?.trim()]
      .filter(Boolean)
      .join(' ') || undefined;

    await updateSupplier.mutateAsync({
      id: supplier.id,
      supplier_name: data.supplier_name,
      contact_name,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
      payment_terms: data.payment_terms,
      notes: data.notes,
      is_active: data.is_active,
    });

    onClose();
  };

  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Edit Supplier
          </DialogTitle>
          <DialogDescription>
            Update supplier information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier_name">
              Supplier Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplier_name"
              {...register('supplier_name', { required: 'Supplier name is required' })}
              placeholder="Enter supplier name"
            />
            {errors.supplier_name && (
              <p className="text-sm text-destructive">{errors.supplier_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_first_name">First Name</Label>
              <Input
                id="contact_first_name"
                {...register('contact_first_name')}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_last_name">Last Name</Label>
              <Input
                id="contact_last_name"
                {...register('contact_last_name')}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              {...register('contact_phone')}
              placeholder="(123) 456-7890"
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setValue('contact_phone', formatted);
              }}
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              placeholder="Enter contact email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              {...register('payment_terms')}
              placeholder="e.g., Net 30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between space-x-2 pt-2 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-base font-semibold">
                Active Status
              </Label>
              <p className="text-sm text-muted-foreground">
                Inactive suppliers won't appear in the active list
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateSupplier.isPending}>
              {updateSupplier.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
