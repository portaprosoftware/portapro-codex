import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Consumable {
  id: string;
  name: string;
  on_hand_qty: number;
  unit_cost: number;
}

interface ReceiveStockModalProps {
  isOpen: boolean;
  consumable: Consumable | null;
  onClose: () => void;
}

interface StockReceiveFormData {
  quantity_received: number;
  unit_cost: number;
  reason: string;
  notes?: string;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  isOpen,
  consumable,
  onClose
}) => {
  const form = useForm<StockReceiveFormData>({
    defaultValues: {
      quantity_received: 0,
      unit_cost: consumable?.unit_cost || 0,
      reason: 'Stock received from vendor',
      notes: ''
    }
  });

  React.useEffect(() => {
    if (consumable) {
      form.setValue('unit_cost', consumable.unit_cost);
    }
  }, [consumable, form]);

  const receiveStock = useMutation({
    mutationFn: async (data: StockReceiveFormData) => {
      if (!consumable) return;

      // Update the consumable's on_hand_qty
      const newQuantity = consumable.on_hand_qty + data.quantity_received;
      
      const { error: updateError } = await supabase
        .from('consumables' as any)
        .update({ 
          on_hand_qty: newQuantity,
          unit_cost: data.unit_cost 
        })
        .eq('id', consumable.id);

      if (updateError) throw updateError;

      // Create a stock adjustment record
      const { error: adjustmentError } = await supabase
        .from('consumable_stock_adjustments' as any)
        .insert([{
          consumable_id: consumable.id,
          adjustment_type: 'received',
          quantity_change: data.quantity_received,
          previous_quantity: consumable.on_hand_qty,
          new_quantity: newQuantity,
          reason: data.reason,
          notes: data.notes
        }]);

      if (adjustmentError) throw adjustmentError;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock received successfully'
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to receive stock',
        variant: 'destructive'
      });
      console.error('Error receiving stock:', error);
    }
  });

  const onSubmit = (data: StockReceiveFormData) => {
    if (data.quantity_received === 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a non-zero quantity',
        variant: 'destructive'
      });
      return;
    }
    receiveStock.mutate(data);
  };

  if (!consumable) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Inventory</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Current stock: {consumable.on_hand_qty} units of {consumable.name}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity_received"
              rules={{ 
                required: 'Quantity is required'
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Change *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder="Enter quantity change (+ to add, - to reduce)" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_cost"
              rules={{ 
                required: 'Unit cost is required',
                min: { value: 0, message: 'Must be positive' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              rules={{ required: 'Reason is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter reason for stock receipt" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted p-3 rounded">
              <p className="text-sm">
                <strong>New Total:</strong> {consumable.on_hand_qty + (form.watch('quantity_received') || 0)} units
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={receiveStock.isPending}>
                {receiveStock.isPending ? 'Updating...' : 'Update Inventory'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};