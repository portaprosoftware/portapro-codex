import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddMobileFuelVendor } from '@/hooks/useMobileFuelVendors';
import { useForm } from 'react-hook-form';

interface AddMobileFuelVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorFormData {
  vendor_name: string;
  contact_name: string;
  phone: string;
  email: string;
  contract_start: string;
  contract_end: string;
  service_window: string;
  billing_terms: string;
  after_hours_available: boolean;
  notes: string;
}

export const AddMobileFuelVendorDialog: React.FC<AddMobileFuelVendorDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<VendorFormData>({
    defaultValues: {
      after_hours_available: false,
    },
  });
  
  const addVendor = useAddMobileFuelVendor();
  const afterHours = watch('after_hours_available');

  const onSubmit = async (data: VendorFormData) => {
    await addVendor.mutateAsync({
      ...data,
      is_active: true,
      rates: {},
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Mobile Fuel Vendor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_name">Vendor Name *</Label>
            <Input
              id="vendor_name"
              {...register('vendor_name', { required: true })}
              placeholder="e.g., Quick Fill Mobile Fueling"
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="vendor@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_start">Contract Start</Label>
              <Input
                id="contract_start"
                type="date"
                {...register('contract_start')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_end">Contract End</Label>
              <Input
                id="contract_end"
                type="date"
                {...register('contract_end')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_window">Service Window</Label>
            <Input
              id="service_window"
              {...register('service_window')}
              placeholder="e.g., 10pm - 6am"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_terms">Billing Terms</Label>
            <Input
              id="billing_terms"
              {...register('billing_terms')}
              placeholder="e.g., Net 30"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="after_hours_available"
              checked={afterHours}
              onCheckedChange={(checked) => setValue('after_hours_available', !!checked)}
            />
            <Label htmlFor="after_hours_available" className="cursor-pointer">
              24/7 After-hours service available
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional vendor notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addVendor.isPending}>
              {addVendor.isPending ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
