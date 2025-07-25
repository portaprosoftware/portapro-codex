import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageLocationSelector } from './StorageLocationSelector';
import { ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StockTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  consumableId?: string;
  currentLocationId?: string;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  open,
  onOpenChange,
  onClose,
  consumableId,
  currentLocationId
}) => {
  const [selectedConsumableId, setSelectedConsumableId] = useState(consumableId || '');
  const [fromLocationId, setFromLocationId] = useState(currentLocationId || '');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consumables } = useQuery({
    queryKey: ['consumables-for-transfer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: availableStock } = useQuery({
    queryKey: ['location-stock', selectedConsumableId, fromLocationId],
    queryFn: async () => {
      if (!selectedConsumableId || !fromLocationId) return null;
      
      const { data, error } = await supabase
        .from('consumable_location_stock')
        .select('quantity')
        .eq('consumable_id', selectedConsumableId)
        .eq('storage_location_id', fromLocationId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.quantity || 0;
    },
    enabled: !!(selectedConsumableId && fromLocationId)
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConsumableId) throw new Error('Please select a consumable');
      if (!fromLocationId) throw new Error('Please select source location');
      if (!toLocationId) throw new Error('Please select destination location');
      if (fromLocationId === toLocationId) throw new Error('Source and destination must be different');
      if (quantity <= 0) throw new Error('Quantity must be greater than 0');
      if (quantity > (availableStock || 0)) throw new Error('Not enough stock available at source location');

      // Remove stock from source location
      const { data: sourceStock, error: sourceQueryError } = await supabase
        .from('consumable_location_stock')
        .select('quantity')
        .eq('consumable_id', selectedConsumableId)
        .eq('storage_location_id', fromLocationId)
        .single();

      if (sourceQueryError) throw sourceQueryError;

      if (sourceStock.quantity < quantity) {
        throw new Error('Insufficient stock at source location');
      }

      // Update source location stock
      const newSourceQuantity = sourceStock.quantity - quantity;
      
      if (newSourceQuantity === 0) {
        // Remove the stock entry if quantity becomes 0
        const { error: deleteError } = await supabase
          .from('consumable_location_stock')
          .delete()
          .eq('consumable_id', selectedConsumableId)
          .eq('storage_location_id', fromLocationId);

        if (deleteError) throw deleteError;
      } else {
        // Update with new quantity
        const { error: updateSourceError } = await supabase
          .from('consumable_location_stock')
          .update({ 
            quantity: newSourceQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('consumable_id', selectedConsumableId)
          .eq('storage_location_id', fromLocationId);

        if (updateSourceError) throw updateSourceError;
      }

      // Add stock to destination location
      const { data: destStock, error: destQueryError } = await supabase
        .from('consumable_location_stock')
        .select('quantity')
        .eq('consumable_id', selectedConsumableId)
        .eq('storage_location_id', toLocationId)
        .maybeSingle();

      if (destQueryError && destQueryError.code !== 'PGRST116') throw destQueryError;

      if (destStock) {
        // Update existing destination stock
        const { error: updateDestError } = await supabase
          .from('consumable_location_stock')
          .update({ 
            quantity: destStock.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('consumable_id', selectedConsumableId)
          .eq('storage_location_id', toLocationId);

        if (updateDestError) throw updateDestError;
      } else {
        // Create new destination stock entry
        const { error: insertDestError } = await supabase
          .from('consumable_location_stock')
          .insert({
            consumable_id: selectedConsumableId,
            storage_location_id: toLocationId,
            quantity: quantity
          });

        if (insertDestError) throw insertDestError;
      }

      // Log the transfer as stock adjustments
      const transferReason = `Stock transfer: ${quantity} units moved between locations`;
      
      // Log outbound adjustment
      await supabase
        .from('consumable_stock_adjustments')
        .insert({
          consumable_id: selectedConsumableId,
          adjustment_type: 'transfer_out',
          quantity_change: -quantity,
          previous_quantity: sourceStock.quantity,
          new_quantity: newSourceQuantity,
          reason: transferReason,
          notes: notes || `Transfer to destination location`
        });

      // Log inbound adjustment
      await supabase
        .from('consumable_stock_adjustments')
        .insert({
          consumable_id: selectedConsumableId,
          adjustment_type: 'transfer_in',
          quantity_change: quantity,
          previous_quantity: destStock?.quantity || 0,
          new_quantity: (destStock?.quantity || 0) + quantity,
          reason: transferReason,
          notes: notes || `Transfer from source location`
        });

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Successfully transferred ${quantity} units`,
      });
      queryClient.invalidateQueries({ queryKey: ['location-stock'] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleReset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process stock transfer",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await transferMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!consumableId) setSelectedConsumableId('');
    if (!currentLocationId) setFromLocationId('');
    setToLocationId('');
    setQuantity(1);
    setNotes('');
  };

  const maxQuantity = availableStock || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Stock Transfer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Consumable *</Label>
            <Select
              value={selectedConsumableId}
              onValueChange={setSelectedConsumableId}
              disabled={!!consumableId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select consumable" />
              </SelectTrigger>
              <SelectContent>
                {consumables?.map((consumable) => (
                  <SelectItem key={consumable.id} value={consumable.id}>
                    {consumable.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>From Location *</Label>
            <StorageLocationSelector
              value={fromLocationId}
              onValueChange={setFromLocationId}
              disabled={!!currentLocationId}
            />
          </div>

          <div className="space-y-2">
            <Label>To Location *</Label>
            <StorageLocationSelector
              value={toLocationId}
              onValueChange={setToLocationId}
              excludeLocationId={fromLocationId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity * 
              {maxQuantity > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Available: {maxQuantity})
                </span>
              )}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional transfer notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedConsumableId || !fromLocationId || !toLocationId || quantity <= 0 || quantity > maxQuantity}
            >
              {isSubmitting ? 'Transferring...' : 'Transfer Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};