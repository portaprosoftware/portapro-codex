import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddMobileFuelVendor } from '@/hooks/useMobileFuelVendors';
import { useForm } from 'react-hook-form';

interface AddMobileFuelVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  phone: string;
  email: string;
  after_hours_contact_person: string;
  after_hours_phone: string;
  preferred_contact_method: 'phone' | 'email' | 'portal' | 'text';
  fuel_type: 'diesel' | 'gasoline' | 'off_road_diesel';
  service_area: string;
  delivery_hours: string;
  min_delivery_quantity_gal: number;
  pricing_model: 'fixed' | 'market_index' | 'cost_plus' | 'tiered';
  payment_terms: 'net_15' | 'net_30' | 'cod' | 'prepaid';
  contract_number: string;
  notes: string;
}

export const AddMobileFuelVendorDialog: React.FC<AddMobileFuelVendorDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<VendorFormData>({
    defaultValues: {
      fuel_type: 'diesel',
      preferred_contact_method: 'phone',
      pricing_model: 'fixed',
      payment_terms: 'net_30',
    },
  });
  
  const addVendor = useAddMobileFuelVendor();
  const fuelType = watch('fuel_type');
  const preferredContactMethod = watch('preferred_contact_method');
  const pricingModel = watch('pricing_model');
  const paymentTerms = watch('payment_terms');

  const onSubmit = async (data: VendorFormData) => {
    await addVendor.mutateAsync({
      ...data,
      is_active: true,
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

          {/* Primary Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                {...register('contact_person')}
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

          {/* After-Hours Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="after_hours_contact_person">After-Hours Contact</Label>
              <Input
                id="after_hours_contact_person"
                {...register('after_hours_contact_person')}
                placeholder="Night/weekend contact"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="after_hours_phone">After-Hours Phone</Label>
              <Input
                id="after_hours_phone"
                type="tel"
                {...register('after_hours_phone')}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-2">
            <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
            <Select
              value={preferredContactMethod}
              onValueChange={(value) => setValue('preferred_contact_method', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuel_type">Fuel Type *</Label>
              <Select
                value={fuelType}
                onValueChange={(value) => setValue('fuel_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="off_road_diesel">Off-Road Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_area">Service Area</Label>
              <Input
                id="service_area"
                {...register('service_area')}
                placeholder="e.g., 50 mile radius"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_hours">Delivery Hours</Label>
              <Input
                id="delivery_hours"
                {...register('delivery_hours')}
                placeholder="e.g., Weekdays 6 PM - 5 AM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_delivery_quantity_gal">Min. Delivery (gallons)</Label>
              <Input
                id="min_delivery_quantity_gal"
                type="number"
                {...register('min_delivery_quantity_gal', { valueAsNumber: true })}
                placeholder="e.g., 100"
              />
            </div>
          </div>

          {/* Pricing & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing_model">Pricing Model</Label>
              <Select
                value={pricingModel}
                onValueChange={(value) => setValue('pricing_model', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="market_index">Market Index</SelectItem>
                  <SelectItem value="cost_plus">Cost + Markup</SelectItem>
                  <SelectItem value="tiered">Tiered Pricing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Select
                value={paymentTerms}
                onValueChange={(value) => setValue('payment_terms', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_number">Contract Number</Label>
            <Input
              id="contract_number"
              {...register('contract_number')}
              placeholder="Contract #"
            />
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
