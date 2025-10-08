import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { useAddFuelTank } from '@/hooks/useFuelTanks';
import { FuelType, FUEL_TYPE_LABELS, TankType, DispenserType } from '@/types/fuel';
import { useForm } from 'react-hook-form';
import { PhotoUploadZone } from './PhotoUploadZone';

interface AddFuelTankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TankFormData {
  // Basic
  tank_number: string;
  tank_name: string;
  tank_type?: TankType;
  fuel_type: FuelType;
  fuel_grade?: string;
  installation_date: string;
  notes: string;
  
  // Capacity
  capacity_gallons: number;
  usable_capacity_gallons?: number;
  secondary_containment_capacity?: number;
  dispenser_type?: DispenserType;
  meter_serial_number?: string;
  
  // Location
  location_description: string;
  access_notes?: string;
  
  // Compliance
  spcc_plan_on_file?: boolean;
  overfill_protection_type?: string;
  leak_detection_method?: string;
  emergency_shutoff_location?: string;
  fire_code_permit_number?: string;
  last_inspection_date?: string;
  
  // Inventory
  initial_stick_reading?: number;
  reorder_threshold_gallons?: number;
  target_fill_level_gallons?: number;
  notify_on_low_stock?: boolean;
  
  // Security
  lock_id?: string;
  tamper_seal_number?: string;
}

export const AddFuelTankDialog: React.FC<AddFuelTankDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<TankFormData>({
    defaultValues: {
      fuel_type: 'diesel',
      notify_on_low_stock: false,
      spcc_plan_on_file: false,
    },
  });
  const addTank = useAddFuelTank();
  const [photos, setPhotos] = useState<string[]>([]);
  
  const fuelType = watch('fuel_type');
  const tankType = watch('tank_type');
  const capacityGallons = watch('capacity_gallons');
  const spccRequired = capacityGallons >= 1320;

  const onSubmit = async (data: TankFormData) => {
    await addTank.mutateAsync({
      ...data,
      photo_urls: photos,
      is_active: true,
      current_level_gallons: data.initial_stick_reading,
    });
    reset();
    setPhotos([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fuel Tank</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Accordion type="multiple" defaultValue={['basic', 'capacity']} className="w-full">
            {/* Basic Information */}
            <AccordionItem value="basic">
              <AccordionTrigger className="text-base font-semibold">
                Basic Information
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tank_number">Tank Number *</Label>
                    <Input
                      id="tank_number"
                      {...register('tank_number', { required: true })}
                      placeholder="e.g., TANK-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tank_name">Tank Name *</Label>
                    <Input
                      id="tank_name"
                      {...register('tank_name', { required: true })}
                      placeholder="e.g., Main Diesel Tank"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tank_type">Tank Type *</Label>
                    <Select
                      value={tankType}
                      onValueChange={(value) => setValue('tank_type', value as TankType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tank type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above_ground">Above-Ground Storage Tank (AST)</SelectItem>
                        <SelectItem value="underground">Underground Storage Tank (UST)</SelectItem>
                        <SelectItem value="mobile_skid">Mobile Skid Tank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Fuel Type *</Label>
                    <Select
                      value={fuelType}
                      onValueChange={(value) => setValue('fuel_type', value as FuelType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FUEL_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuel_grade">Fuel Grade</Label>
                    <Input
                      id="fuel_grade"
                      {...register('fuel_grade')}
                      placeholder="e.g., Diesel #2, 87 Octane, DEF"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="installation_date">Installation Date</Label>
                    <Input
                      id="installation_date"
                      type="date"
                      {...register('installation_date')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Photos (Tank, Containment, Dispenser)</Label>
                  <PhotoUploadZone photos={photos} onPhotosChange={setPhotos} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">General Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Additional notes about this tank..."
                    rows={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Capacity & Dispensing */}
            <AccordionItem value="capacity">
              <AccordionTrigger className="text-base font-semibold">
                Capacity & Dispensing
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity_gallons">Total Capacity (Gallons) *</Label>
                    <Input
                      id="capacity_gallons"
                      type="number"
                      step="0.01"
                      {...register('capacity_gallons', { required: true, valueAsNumber: true })}
                      placeholder="e.g., 1500"
                    />
                    {spccRequired && (
                      <p className="text-xs text-yellow-600">⚠️ Capacity ≥ 1320 gal requires SPCC</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usable_capacity_gallons">Usable Capacity (Gallons)</Label>
                    <Input
                      id="usable_capacity_gallons"
                      type="number"
                      step="0.01"
                      {...register('usable_capacity_gallons', { valueAsNumber: true })}
                      placeholder="e.g., 1450"
                    />
                  </div>
                </div>

                {(tankType === 'above_ground') && (
                  <div className="space-y-2">
                    <Label htmlFor="secondary_containment_capacity">Secondary Containment (Gallons)</Label>
                    <Input
                      id="secondary_containment_capacity"
                      type="number"
                      step="0.01"
                      {...register('secondary_containment_capacity', { valueAsNumber: true })}
                      placeholder="110% of tank capacity"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dispenser_type">Dispenser Type</Label>
                    <Select
                      onValueChange={(value) => setValue('dispenser_type', value as DispenserType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispenser type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gravity">Gravity Feed</SelectItem>
                        <SelectItem value="electric_pump">Electric Pump</SelectItem>
                        <SelectItem value="manual">Manual Pump</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meter_serial_number">Meter Serial #</Label>
                    <Input
                      id="meter_serial_number"
                      {...register('meter_serial_number')}
                      placeholder="e.g., MTR-12345"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Location & Access */}
            <AccordionItem value="location">
              <AccordionTrigger className="text-base font-semibold">
                Location & Access
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="location_description">Location Description</Label>
                  <Input
                    id="location_description"
                    {...register('location_description')}
                    placeholder="e.g., Behind main warehouse, north side"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access_notes">Access Instructions</Label>
                  <Textarea
                    id="access_notes"
                    {...register('access_notes')}
                    placeholder="Gate code, hours, special instructions..."
                    rows={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Compliance & Safety (show when AST/UST selected) */}
            {(tankType === 'above_ground' || tankType === 'underground') && (
              <AccordionItem value="compliance">
                <AccordionTrigger className="text-base font-semibold">
                  Compliance & Safety
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="spcc_plan_on_file">SPCC Plan On File?</Label>
                      <p className="text-xs text-muted-foreground">
                        {spccRequired ? 'Required for tanks ≥ 1320 gallons' : 'Optional'}
                      </p>
                    </div>
                    <Switch
                      id="spcc_plan_on_file"
                      onCheckedChange={(checked) => setValue('spcc_plan_on_file', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="overfill_protection_type">Overfill Protection</Label>
                      <Select
                        onValueChange={(value) => setValue('overfill_protection_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto_shutoff">Auto Shutoff</SelectItem>
                          <SelectItem value="alarm">High Level Alarm</SelectItem>
                          <SelectItem value="ball_float">Ball Float</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leak_detection_method">Leak Detection</Label>
                      <Select
                        onValueChange={(value) => setValue('leak_detection_method', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interstitial">Interstitial Monitor</SelectItem>
                          <SelectItem value="stick_paste">Stick & Paste</SelectItem>
                          <SelectItem value="atg">Automatic Tank Gauge</SelectItem>
                          <SelectItem value="visual">Visual Inspection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_shutoff_location">Emergency Shutoff Location</Label>
                      <Input
                        id="emergency_shutoff_location"
                        {...register('emergency_shutoff_location')}
                        placeholder="e.g., East wall, 3ft from pump"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fire_code_permit_number">Fire Code Permit #</Label>
                      <Input
                        id="fire_code_permit_number"
                        {...register('fire_code_permit_number')}
                        placeholder="e.g., FP-2024-001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="last_inspection_date">Last Inspection Date</Label>
                      <Input
                        id="last_inspection_date"
                        type="date"
                        {...register('last_inspection_date')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Inspection (Auto-calculated)</Label>
                      <Input disabled placeholder="12 months from last inspection" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Inventory Controls */}
            <AccordionItem value="inventory">
              <AccordionTrigger className="text-base font-semibold">
                Inventory Controls
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial_stick_reading">Initial Level (Gal)</Label>
                    <Input
                      id="initial_stick_reading"
                      type="number"
                      step="0.01"
                      {...register('initial_stick_reading', { valueAsNumber: true })}
                      placeholder="Current fuel level"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorder_threshold_gallons">Reorder Threshold (Gal)</Label>
                    <Input
                      id="reorder_threshold_gallons"
                      type="number"
                      step="0.01"
                      {...register('reorder_threshold_gallons', { valueAsNumber: true })}
                      placeholder="e.g., 200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_fill_level_gallons">Target Fill Level (Gal)</Label>
                    <Input
                      id="target_fill_level_gallons"
                      type="number"
                      step="0.01"
                      {...register('target_fill_level_gallons', { valueAsNumber: true })}
                      placeholder="e.g., 1400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify_on_low_stock">Enable Low Stock Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications when fuel drops below threshold
                    </p>
                  </div>
                  <Switch
                    id="notify_on_low_stock"
                    onCheckedChange={(checked) => setValue('notify_on_low_stock', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Security */}
            <AccordionItem value="security">
              <AccordionTrigger className="text-base font-semibold">
                Security
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lock_id">Lock/Padlock ID</Label>
                    <Input
                      id="lock_id"
                      {...register('lock_id')}
                      placeholder="e.g., LOCK-T001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tamper_seal_number">Tamper Seal #</Label>
                    <Input
                      id="tamper_seal_number"
                      {...register('tamper_seal_number')}
                      placeholder="e.g., SEAL-2024-001"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addTank.isPending}>
              {addTank.isPending ? 'Adding...' : 'Add Tank'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
