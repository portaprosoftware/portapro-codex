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
  gallons_delivered: number;
  total_cost: number;
  supplier_name: string;
  invoice_number: string;
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
      total_cost: Number(data.total_cost),
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

          <div className="space-y-2">
            <Label htmlFor="delivery_date">Delivery Date *</Label>
            <Input
              id="delivery_date"
              type="date"
              {...register('delivery_date', { required: true })}
            />
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
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input
                id="supplier_name"
                {...register('supplier_name')}
                placeholder="e.g., ABC Fuel Supply"
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
