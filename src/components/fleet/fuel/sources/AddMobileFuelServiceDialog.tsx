import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddMobileFuelService } from '@/hooks/useMobileFuelServices';
import { useMobileFuelVendors } from '@/hooks/useMobileFuelVendors';
import { useForm } from 'react-hook-form';

interface AddMobileFuelServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: string;
}

interface ServiceFormData {
  vendor_id: string;
  service_date: string;
  invoice_number: string;
  total_gallons: number;
  total_cost: number;
  vehicles_fueled: number;
  location: string;
  notes: string;
}

export const AddMobileFuelServiceDialog: React.FC<AddMobileFuelServiceDialogProps> = ({ 
  open, 
  onOpenChange,
  vendorId 
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<ServiceFormData>({
    defaultValues: {
      vendor_id: vendorId || '',
      service_date: new Date().toISOString().split('T')[0],
      vehicles_fueled: 1,
    },
  });
  
  const { data: vendors = [] } = useMobileFuelVendors();
  const addService = useAddMobileFuelService();
  const selectedVendorId = watch('vendor_id');

  React.useEffect(() => {
    if (vendorId) {
      setValue('vendor_id', vendorId);
    }
  }, [vendorId, setValue]);

  const onSubmit = async (data: ServiceFormData) => {
    await addService.mutateAsync({
      ...data,
      total_gallons: Number(data.total_gallons),
      total_cost: Number(data.total_cost),
      vehicles_fueled: Number(data.vehicles_fueled),
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Mobile Fuel Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_id">Vendor *</Label>
            <Select
              value={selectedVendorId}
              onValueChange={(value) => setValue('vendor_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_date">Service Date *</Label>
              <Input
                id="service_date"
                type="date"
                {...register('service_date', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                {...register('invoice_number')}
                placeholder="Invoice #"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_gallons">Total Gallons *</Label>
              <Input
                id="total_gallons"
                type="number"
                step="0.01"
                {...register('total_gallons', { required: true })}
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_cost">Total Cost *</Label>
              <Input
                id="total_cost"
                type="number"
                step="0.01"
                {...register('total_cost', { required: true })}
                placeholder="e.g., 1250.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicles_fueled">Vehicles Fueled *</Label>
              <Input
                id="vehicles_fueled"
                type="number"
                {...register('vehicles_fueled', { required: true })}
                placeholder="e.g., 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., Main yard"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Service notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addService.isPending}>
              {addService.isPending ? 'Logging...' : 'Log Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
