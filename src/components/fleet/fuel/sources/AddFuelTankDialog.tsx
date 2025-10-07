import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddFuelTank } from '@/hooks/useFuelTanks';
import { FuelType, FUEL_TYPE_LABELS } from '@/types/fuel';
import { useForm } from 'react-hook-form';

interface AddFuelTankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TankFormData {
  tank_number: string;
  tank_name: string;
  capacity_gallons: number;
  fuel_type: FuelType;
  install_date: string;
  spill_kit_location: string;
  location_description: string;
  notes: string;
}

export const AddFuelTankDialog: React.FC<AddFuelTankDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<TankFormData>({
    defaultValues: {
      fuel_type: 'diesel',
    },
  });
  const addTank = useAddFuelTank();
  const fuelType = watch('fuel_type');

  const onSubmit = async (data: TankFormData) => {
    await addTank.mutateAsync({
      ...data,
      meter_current_reading: 0,
      is_active: true,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fuel Tank</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="tank_name">Tank Name</Label>
              <Input
                id="tank_name"
                {...register('tank_name')}
                placeholder="e.g., Main Diesel Tank"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity_gallons">Capacity (Gallons) *</Label>
              <Input
                id="capacity_gallons"
                type="number"
                step="0.01"
                {...register('capacity_gallons', { required: true, valueAsNumber: true })}
                placeholder="e.g., 500"
              />
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

          <div className="space-y-2">
            <Label htmlFor="install_date">Install Date</Label>
            <Input
              id="install_date"
              type="date"
              {...register('install_date')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spill_kit_location">Spill Kit Location</Label>
            <Input
              id="spill_kit_location"
              {...register('spill_kit_location')}
              placeholder="e.g., North wall, 10ft from tank"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_description">Location Description</Label>
            <Input
              id="location_description"
              {...register('location_description')}
              placeholder="e.g., Behind main warehouse"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this tank..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
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
