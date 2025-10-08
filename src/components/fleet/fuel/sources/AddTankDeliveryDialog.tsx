import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { useAddFuelTankDelivery } from '@/hooks/useFuelTankDeliveries';
import { useFuelTanks } from '@/hooks/useFuelTanks';
import { useForm } from 'react-hook-form';
import { SupplierAutocomplete } from './SupplierAutocomplete';
import { DeliveryPhotoUpload } from './DeliveryPhotoUpload';
import { VarianceWarningBadge } from './VarianceWarningBadge';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AddTankDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId?: string;
}

interface DeliveryFormData {
  tank_id: string;
  delivery_date: string;
  delivery_time: string;
  supplier_name: string;
  bol_ticket_number: string;
  driver_name: string;
  truck_number: string;
  fuel_grade: string;
  winter_blend: boolean;
  additive_notes: string;
  gross_gallons: number;
  temperature_corrected_gallons: number;
  price_per_gallon_pretax: number;
  excise_tax: number;
  delivery_fee: number;
  hazmat_fee: number;
  payment_method: string;
  payment_terms: string;
  pre_delivery_stick_reading: number;
  post_delivery_stick_reading: number;
  water_bottom_test_result: string;
  water_bottom_inches: number;
  after_hours_delivery: boolean;
  partial_fill_blocked: boolean;
  blocked_reason: string;
  notes: string;
  gallons_delivered: number;
  total_cost: number;
  invoice_number: string;
}

export const AddTankDeliveryDialog: React.FC<AddTankDeliveryDialogProps> = ({ 
  open, 
  onOpenChange,
  tankId 
}) => {
  const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
  const { register, handleSubmit, reset, setValue, watch } = useForm<DeliveryFormData>({
    defaultValues: {
      tank_id: tankId || '',
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_time: currentTime,
      winter_blend: false,
      excise_tax: 0,
      delivery_fee: 0,
      hazmat_fee: 0,
      payment_terms: 'Net-30',
      after_hours_delivery: false,
      partial_fill_blocked: false,
    },
  });
  
  const { data: tanks = [] } = useFuelTanks();
  const addDelivery = useAddFuelTankDelivery();
  const selectedTankId = watch('tank_id');
  const selectedTank = tanks.find(t => t.id === selectedTankId);
  const fuelGrade = watch('fuel_grade');
  const grossGallons = watch('gross_gallons');
  const tempCorrectedGallons = watch('temperature_corrected_gallons');
  const pricePerGallon = watch('price_per_gallon_pretax');
  const exciseTax = watch('excise_tax');
  const deliveryFee = watch('delivery_fee');
  const hazmatFee = watch('hazmat_fee');
  const preStick = watch('pre_delivery_stick_reading');
  const postStick = watch('post_delivery_stick_reading');
  const waterTest = watch('water_bottom_test_result');
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [gradeMismatch, setGradeMismatch] = useState(false);

  // Auto-calculate total cost
  useEffect(() => {
    if (pricePerGallon && (tempCorrectedGallons || grossGallons)) {
      const gallons = tempCorrectedGallons || grossGallons;
      const total = (pricePerGallon * gallons) + 
                    (exciseTax || 0) + 
                    (deliveryFee || 0) + 
                    (hazmatFee || 0);
      setValue('total_cost', total);
    }
  }, [pricePerGallon, tempCorrectedGallons, grossGallons, exciseTax, deliveryFee, hazmatFee, setValue]);

  // Auto-set temperature-corrected to gross if not specified
  useEffect(() => {
    if (grossGallons && !tempCorrectedGallons) {
      setValue('temperature_corrected_gallons', grossGallons);
    }
  }, [grossGallons, tempCorrectedGallons, setValue]);

  // Inherit fuel grade from tank
  useEffect(() => {
    if (selectedTank?.fuel_grade) {
      setValue('fuel_grade', selectedTank.fuel_grade);
    }
  }, [selectedTank, setValue]);

  // Check for fuel grade mismatch
  useEffect(() => {
    if (selectedTank?.fuel_grade && fuelGrade && selectedTank.fuel_grade !== fuelGrade) {
      setGradeMismatch(true);
      toast.warning(`Tank expects ${selectedTank.fuel_grade}, but delivery shows ${fuelGrade}`);
    } else {
      setGradeMismatch(false);
    }
  }, [selectedTank, fuelGrade]);

  // Calculate variance
  const variance = preStick && postStick && tempCorrectedGallons
    ? (postStick - preStick) - tempCorrectedGallons
    : 0;
  const variancePercent = tempCorrectedGallons
    ? (variance / tempCorrectedGallons) * 100
    : 0;

  React.useEffect(() => {
    if (tankId) {
      setValue('tank_id', tankId);
    }
  }, [tankId, setValue]);

  const onSubmit = async (data: DeliveryFormData) => {
    const netGallons = data.temperature_corrected_gallons || data.gross_gallons;
    
    await addDelivery.mutateAsync({
      tank_id: data.tank_id,
      delivery_date: data.delivery_date,
      delivery_time: data.delivery_time,
      supplier_name: data.supplier_name,
      bol_ticket_number: data.bol_ticket_number,
      driver_name: data.driver_name,
      truck_number: data.truck_number,
      fuel_grade: data.fuel_grade,
      winter_blend: data.winter_blend,
      additive_notes: data.additive_notes,
      gross_gallons: Number(data.gross_gallons),
      temperature_corrected_gallons: Number(netGallons),
      gallons_delivered: Number(netGallons),
      price_per_gallon_pretax: Number(data.price_per_gallon_pretax),
      excise_tax: Number(data.excise_tax || 0),
      delivery_fee: Number(data.delivery_fee || 0),
      hazmat_fee: Number(data.hazmat_fee || 0),
      total_cost: Number(data.total_cost),
      payment_method: data.payment_method,
      payment_terms: data.payment_terms,
      pre_delivery_stick_reading: data.pre_delivery_stick_reading ? Number(data.pre_delivery_stick_reading) : undefined,
      post_delivery_stick_reading: data.post_delivery_stick_reading ? Number(data.post_delivery_stick_reading) : undefined,
      water_bottom_test_result: data.water_bottom_test_result,
      water_bottom_inches: data.water_bottom_inches ? Number(data.water_bottom_inches) : undefined,
      after_hours_delivery: data.after_hours_delivery,
      partial_fill_blocked: data.partial_fill_blocked,
      blocked_reason: data.blocked_reason,
      notes: data.notes,
      invoice_number: data.bol_ticket_number,
      ticket_photo_urls: photos,
    });
    reset();
    setPhotos([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Tank Delivery</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Accordion type="multiple" defaultValue={['basics', 'pricing']} className="w-full">
            {/* Delivery Basics */}
            <AccordionItem value="basics">
              <AccordionTrigger className="text-lg font-semibold">
                📋 Delivery Basics
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tank_id">Tank *</Label>
                    <Select
                      value={selectedTankId}
                      onValueChange={(value) => setValue('tank_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tank" />
                      </SelectTrigger>
                      <SelectContent>
                        {tanks.map((tank) => (
                          <SelectItem key={tank.id} value={tank.id}>
                            {tank.tank_name || `Tank ${tank.tank_number}`} ({tank.capacity_gallons} gal)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_date">Delivery Date *</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      {...register('delivery_date', { required: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_time">Delivery Time</Label>
                    <Input
                      id="delivery_time"
                      type="time"
                      {...register('delivery_time')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier_name">Supplier Name</Label>
                    <SupplierAutocomplete
                      value={watch('supplier_name')}
                      onValueChange={(value) => setValue('supplier_name', value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bol_ticket_number">BOL / Ticket Number</Label>
                    <Input
                      id="bol_ticket_number"
                      {...register('bol_ticket_number')}
                      placeholder="Bill of Lading #"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driver_name">Driver Name</Label>
                    <Input
                      id="driver_name"
                      {...register('driver_name')}
                      placeholder="Driver name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="truck_number">Truck Number</Label>
                    <Input
                      id="truck_number"
                      {...register('truck_number')}
                      placeholder="Truck #"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuel_grade">
                      Fuel Grade {gradeMismatch && <AlertTriangle className="inline h-4 w-4 text-amber-500" />}
                    </Label>
                    <Input
                      id="fuel_grade"
                      {...register('fuel_grade')}
                      placeholder="e.g., Diesel #2, 87 Octane"
                    />
                    {selectedTank?.fuel_grade && (
                      <p className="text-xs text-muted-foreground">
                        Tank expects: {selectedTank.fuel_grade}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="winter_blend"
                    checked={watch('winter_blend')}
                    onCheckedChange={(checked) => setValue('winter_blend', checked)}
                  />
                  <Label htmlFor="winter_blend">Winter Blend / Additive</Label>
                </div>
                {watch('winter_blend') && (
                  <div className="space-y-2">
                    <Label htmlFor="additive_notes">Additive Notes</Label>
                    <Input
                      id="additive_notes"
                      {...register('additive_notes')}
                      placeholder="Describe winter blend or additive"
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Quantities & Pricing */}
            <AccordionItem value="pricing">
              <AccordionTrigger className="text-lg font-semibold">
                💰 Quantities & Pricing
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gross_gallons">Gross Gallons (from ticket) *</Label>
                    <Input
                      id="gross_gallons"
                      type="number"
                      step="0.01"
                      {...register('gross_gallons', { required: true })}
                      placeholder="e.g., 500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature_corrected_gallons">
                      Temperature-Corrected Gallons (Net)
                    </Label>
                    <Input
                      id="temperature_corrected_gallons"
                      type="number"
                      step="0.01"
                      {...register('temperature_corrected_gallons')}
                      placeholder="Auto-filled from gross if not specified"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_gallon_pretax">Price per Gallon (pre-tax) *</Label>
                    <Input
                      id="price_per_gallon_pretax"
                      type="number"
                      step="0.001"
                      {...register('price_per_gallon_pretax', { required: true })}
                      placeholder="e.g., 2.50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excise_tax">Excise Tax</Label>
                    <Input
                      id="excise_tax"
                      type="number"
                      step="0.01"
                      {...register('excise_tax')}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee">Delivery Fee</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      {...register('delivery_fee')}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hazmat_fee">Hazmat Fee</Label>
                    <Input
                      id="hazmat_fee"
                      type="number"
                      step="0.01"
                      {...register('hazmat_fee')}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    Total Cost: ${watch('total_cost')?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Auto-calculated from gallons × price + fees
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={watch('payment_method')}
                      onValueChange={(value) => setValue('payment_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select
                      value={watch('payment_terms')}
                      onValueChange={(value) => setValue('payment_terms', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net-30">Net-30</SelectItem>
                        <SelectItem value="Net-15">Net-15</SelectItem>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Reconciliation */}
            <AccordionItem value="reconciliation">
              <AccordionTrigger className="text-lg font-semibold">
                📊 Reconciliation
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pre_delivery_stick_reading">Pre-Delivery Stick Reading (gal)</Label>
                    <Input
                      id="pre_delivery_stick_reading"
                      type="number"
                      step="0.1"
                      {...register('pre_delivery_stick_reading')}
                      placeholder="Tank level before delivery"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="post_delivery_stick_reading">Post-Delivery Stick Reading (gal)</Label>
                    <Input
                      id="post_delivery_stick_reading"
                      type="number"
                      step="0.1"
                      {...register('post_delivery_stick_reading')}
                      placeholder="Tank level after delivery"
                    />
                  </div>
                </div>

                {preStick && postStick && tempCorrectedGallons && (
                  <div className="p-4 bg-muted rounded-lg">
                    <VarianceWarningBadge
                      variance={variance}
                      variancePercent={variancePercent}
                      tolerance={2.0}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="water_bottom_test_result">Water-Bottom Test</Label>
                    <Select
                      value={watch('water_bottom_test_result')}
                      onValueChange={(value) => setValue('water_bottom_test_result', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Test result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {waterTest === 'fail' && (
                    <div className="space-y-2">
                      <Label htmlFor="water_bottom_inches">Water Depth (inches)</Label>
                      <Input
                        id="water_bottom_inches"
                        type="number"
                        step="0.1"
                        {...register('water_bottom_inches')}
                        placeholder="Water depth if test failed"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Attach Ticket/Photos</Label>
                  <DeliveryPhotoUpload photos={photos} onPhotosChange={setPhotos} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Operational Context */}
            <AccordionItem value="operational">
              <AccordionTrigger className="text-lg font-semibold">
                🔧 Operational Context
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="after_hours_delivery"
                    checked={watch('after_hours_delivery')}
                    onCheckedChange={(checked) => setValue('after_hours_delivery', checked)}
                  />
                  <Label htmlFor="after_hours_delivery">After-Hours Delivery</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="partial_fill_blocked"
                    checked={watch('partial_fill_blocked')}
                    onCheckedChange={(checked) => setValue('partial_fill_blocked', checked)}
                  />
                  <Label htmlFor="partial_fill_blocked">Partial Fill (Could not fill to target)</Label>
                </div>

                {watch('partial_fill_blocked') && (
                  <div className="space-y-2">
                    <Label htmlFor="blocked_reason">Reason for Partial Fill</Label>
                    <Textarea
                      id="blocked_reason"
                      {...register('blocked_reason')}
                      placeholder="e.g., Pump down, access issue, tank full"
                      rows={2}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Any additional delivery notes..."
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addDelivery.isPending}>
              {addDelivery.isPending ? 'Logging...' : 'Log Delivery'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
