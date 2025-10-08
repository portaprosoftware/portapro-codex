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
import { FUEL_GRADE_LABELS, PAYMENT_METHOD_LABELS, FuelGrade, MobilePaymentMethod } from '@/types/fuel';

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
  // Tier 1 fields
  service_start_time?: string;
  service_end_time?: string;
  vendor_driver_name?: string;
  vendor_truck_number?: string;
  fuel_grade?: FuelGrade;
  price_per_gallon?: number;
  payment_method?: MobilePaymentMethod;
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
  const totalGallons = watch('total_gallons');
  const pricePerGallon = watch('price_per_gallon');
  const fuelGrade = watch('fuel_grade');
  const paymentMethod = watch('payment_method');

  // Auto-calculate total cost when price per gallon or total gallons changes
  React.useEffect(() => {
    if (pricePerGallon && totalGallons) {
      const calculatedTotal = Number(pricePerGallon) * Number(totalGallons);
      setValue('total_cost', Number(calculatedTotal.toFixed(2)));
    }
  }, [pricePerGallon, totalGallons, setValue]);

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
      price_per_gallon: data.price_per_gallon ? Number(data.price_per_gallon) : undefined,
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
              <Label htmlFor="service_start_time">Delivery Window Start</Label>
              <Input
                id="service_start_time"
                type="time"
                {...register('service_start_time')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_end_time">Delivery Window End</Label>
              <Input
                id="service_end_time"
                type="time"
                {...register('service_end_time')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_driver_name">Driver / Tech Name</Label>
              <Input
                id="vendor_driver_name"
                {...register('vendor_driver_name')}
                placeholder="Vendor representative"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_truck_number">Vendor Truck / Unit #</Label>
              <Input
                id="vendor_truck_number"
                {...register('vendor_truck_number')}
                placeholder="Truck identifier"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel_grade">Fuel Grade / Type</Label>
            <Select
              value={fuelGrade}
              onValueChange={(value) => setValue('fuel_grade', value as FuelGrade)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fuel grade" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FUEL_GRADE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label htmlFor="price_per_gallon">Price per Gallon</Label>
              <Input
                id="price_per_gallon"
                type="number"
                step="0.001"
                {...register('price_per_gallon')}
                placeholder="e.g., 2.50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_cost">Total Cost * {pricePerGallon && totalGallons && (
              <span className="text-xs text-muted-foreground ml-2">
                (Auto-calculated: {totalGallons} gal × ${pricePerGallon}/gal)
              </span>
            )}</Label>
            <Input
              id="total_cost"
              type="number"
              step="0.01"
              {...register('total_cost', { required: true })}
              placeholder="e.g., 1250.00"
            />
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
            <Label htmlFor="payment_method">Payment Method / Terms</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setValue('payment_method', value as MobilePaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
