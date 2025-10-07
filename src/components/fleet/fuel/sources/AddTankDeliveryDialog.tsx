import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddFuelTankDelivery } from '@/hooks/useFuelTankDeliveries';
import { useFuelTanks } from '@/hooks/useFuelTanks';
import { useForm } from 'react-hook-form';

interface AddTankDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId?: string;
}

interface DeliveryFormData {
  tank_id: string;
  delivery_date: string;
  vendor_name: string;
  vendor_contact: string;
  vendor_phone: string;
  gallons_delivered: number;
  cost_total: number;
  bol_number: string;
  invoice_number: string;
  meter_before: number;
  meter_after: number;
  notes: string;
}

export const AddTankDeliveryDialog: React.FC<AddTankDeliveryDialogProps> = ({ 
  open, 
  onOpenChange,
  tankId 
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<DeliveryFormData>({
    defaultValues: {
      tank_id: tankId || '',
      delivery_date: new Date().toISOString().split('T')[0],
    },
  });
  
  const { data: tanks = [] } = useFuelTanks();
  const addDelivery = useAddFuelTankDelivery();
  const selectedTankId = watch('tank_id');

  React.useEffect(() => {
    if (tankId) {
      setValue('tank_id', tankId);
    }
  }, [tankId, setValue]);

  const onSubmit = async (data: DeliveryFormData) => {
    await addDelivery.mutateAsync({
      ...data,
      gallons_delivered: Number(data.gallons_delivered),
      cost_total: Number(data.cost_total),
      meter_before: data.meter_before ? Number(data.meter_before) : undefined,
      meter_after: data.meter_after ? Number(data.meter_after) : undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Tank Delivery</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Delivery Date *</Label>
              <Input
                id="delivery_date"
                type="date"
                {...register('delivery_date', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input
                id="vendor_name"
                {...register('vendor_name', { required: true })}
                placeholder="e.g., ABC Fuel Supply"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_contact">Contact Person</Label>
              <Input
                id="vendor_contact"
                {...register('vendor_contact')}
                placeholder="Contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_phone">Phone</Label>
              <Input
                id="vendor_phone"
                {...register('vendor_phone')}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gallons_delivered">Gallons Delivered *</Label>
              <Input
                id="gallons_delivered"
                type="number"
                step="0.01"
                {...register('gallons_delivered', { required: true })}
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_total">Total Cost *</Label>
              <Input
                id="cost_total"
                type="number"
                step="0.01"
                {...register('cost_total', { required: true })}
                placeholder="e.g., 1250.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bol_number">BOL Number</Label>
              <Input
                id="bol_number"
                {...register('bol_number')}
                placeholder="Bill of Lading #"
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
              <Label htmlFor="meter_before">Meter Before</Label>
              <Input
                id="meter_before"
                type="number"
                step="0.01"
                {...register('meter_before')}
                placeholder="Reading before delivery"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meter_after">Meter After</Label>
              <Input
                id="meter_after"
                type="number"
                step="0.01"
                {...register('meter_after')}
                placeholder="Reading after delivery"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional delivery notes..."
              rows={3}
            />
          </div>

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
