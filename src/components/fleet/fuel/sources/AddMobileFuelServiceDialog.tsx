import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAddMobileFuelService } from '@/hooks/useMobileFuelServices';
import { useMobileFuelVendors } from '@/hooks/useMobileFuelVendors';
import { useForm } from 'react-hook-form';
import { FUEL_GRADE_LABELS, PAYMENT_METHOD_LABELS, FuelGrade, MobilePaymentMethod } from '@/types/fuel';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

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
  // Tier 2 fields
  variance_notes?: string;
}

interface VehicleAssignment {
  vehicle_id: string;
  gallons_dispensed: number;
  odometer_reading?: number;
  vehicle_notes?: string;
}

export const AddMobileFuelServiceDialog: React.FC<AddMobileFuelServiceDialogProps> = ({ 
  open, 
  onOpenChange,
  vendorId 
}) => {
  const { user } = useUser();
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

  // Tier 2: Vehicle assignments
  const [vehicleAssignments, setVehicleAssignments] = useState<VehicleAssignment[]>([]);
  const [deliveryTickets, setDeliveryTickets] = useState<File[]>([]);
  const [uploadingTickets, setUploadingTickets] = useState(false);

  // Fetch vehicles for dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, nickname, license_plate, make, model')
        .order('nickname');
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate variance
  const totalVehicleGallons = vehicleAssignments.reduce((sum, v) => sum + (Number(v.gallons_dispensed) || 0), 0);
  const hasVariance = totalGallons && Math.abs(Number(totalGallons) - totalVehicleGallons) > 1;

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
    let ticketUrls: string[] = [];

    // Upload delivery tickets if any
    if (deliveryTickets.length > 0) {
      setUploadingTickets(true);
      try {
        const uploadPromises = deliveryTickets.map(async (file) => {
          const filePath = `delivery-tickets/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

          return publicUrl;
        });

        ticketUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Error uploading tickets:', error);
      } finally {
        setUploadingTickets(false);
      }
    }

    await addService.mutateAsync({
      service: {
        ...data,
        total_gallons: Number(data.total_gallons),
        total_cost: Number(data.total_cost),
        vehicles_fueled: vehicleAssignments.length > 0 ? vehicleAssignments.length : Number(data.vehicles_fueled),
        price_per_gallon: data.price_per_gallon ? Number(data.price_per_gallon) : undefined,
        verified_by_user_id: user?.id,
        delivery_ticket_urls: ticketUrls.length > 0 ? ticketUrls : undefined,
        variance_flag: hasVariance,
      },
      vehicles: vehicleAssignments.length > 0 ? vehicleAssignments.map(v => ({
        vehicle_id: v.vehicle_id,
        gallons_dispensed: Number(v.gallons_dispensed),
        odometer_reading: v.odometer_reading ? Number(v.odometer_reading) : undefined,
        vehicle_notes: v.vehicle_notes,
      })) : undefined,
    });
    
    reset();
    setVehicleAssignments([]);
    setDeliveryTickets([]);
    onOpenChange(false);
  };

  const addVehicleAssignment = () => {
    setVehicleAssignments([...vehicleAssignments, {
      vehicle_id: '',
      gallons_dispensed: 0,
    }]);
  };

  const removeVehicleAssignment = (index: number) => {
    setVehicleAssignments(vehicleAssignments.filter((_, i) => i !== index));
  };

  const updateVehicleAssignment = (index: number, field: keyof VehicleAssignment, value: any) => {
    const updated = [...vehicleAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setVehicleAssignments(updated);
  };

  const handleTicketUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDeliveryTickets([...deliveryTickets, ...Array.from(e.target.files)]);
    }
  };

  const removeTicket = (index: number) => {
    setDeliveryTickets(deliveryTickets.filter((_, i) => i !== index));
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

          <div className="space-y-2">
            <Label htmlFor="location">Service Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Main yard"
            />
          </div>

          {/* Tier 2: Vehicle Assignments */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Vehicle Breakdown (Optional)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addVehicleAssignment}>
                <Plus className="h-4 w-4 mr-1" />
                Add Vehicle
              </Button>
            </div>

            {hasVariance && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Variance: {Math.abs(Number(totalGallons) - totalVehicleGallons).toFixed(2)} gal difference
              </Badge>
            )}

            {vehicleAssignments.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {vehicleAssignments.map((assignment, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-muted/50">
                    <div className="col-span-4">
                      <Select
                        value={assignment.vehicle_id}
                        onValueChange={(value) => updateVehicleAssignment(index, 'vehicle_id', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.nickname || vehicle.license_plate || `${vehicle.make} ${vehicle.model}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Gallons"
                        value={assignment.gallons_dispensed || ''}
                        onChange={(e) => updateVehicleAssignment(index, 'gallons_dispensed', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Odometer"
                        value={assignment.odometer_reading || ''}
                        onChange={(e) => updateVehicleAssignment(index, 'odometer_reading', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Notes"
                        value={assignment.vehicle_notes || ''}
                        onChange={(e) => updateVehicleAssignment(index, 'vehicle_notes', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeVehicleAssignment(index)}
                        className="h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {vehicleAssignments.length > 0 && (
                  <div className="text-sm text-muted-foreground px-3">
                    Total: {totalVehicleGallons.toFixed(2)} gallons across {vehicleAssignments.length} vehicle(s)
                  </div>
                )}
              </div>
            )}

            {vehicleAssignments.length === 0 && (
              <div className="space-y-2">
                <Label htmlFor="vehicles_fueled">Number of Vehicles Fueled *</Label>
                <Input
                  id="vehicles_fueled"
                  type="number"
                  {...register('vehicles_fueled', { required: true })}
                  placeholder="e.g., 5"
                />
              </div>
            )}
          </div>

          {/* Tier 2: Delivery Tickets */}
          <div className="space-y-2 border-t pt-4">
            <Label>Delivery Tickets / Photos</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleTicketUpload}
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <input type="file" className="hidden" accept="image/*,.pdf" multiple onChange={handleTicketUpload} />
                </label>
              </Button>
            </div>
            {deliveryTickets.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {deliveryTickets.map((file, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {file.name.substring(0, 20)}
                    <button
                      type="button"
                      onClick={() => removeTicket(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {hasVariance && (
            <div className="space-y-2">
              <Label htmlFor="variance_notes">Variance Notes</Label>
              <Textarea
                id="variance_notes"
                {...register('variance_notes')}
                placeholder="Explain the discrepancy..."
                rows={2}
              />
            </div>
          )}

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
            <Button type="submit" disabled={addService.isPending || uploadingTickets}>
              {uploadingTickets ? 'Uploading...' : addService.isPending ? 'Logging...' : 'Log Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
