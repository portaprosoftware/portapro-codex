import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose
}) => {
  const [consumableId, setConsumableId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const { data: consumables } = useQuery({
    queryKey: ['consumables-for-transfer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('*')
        .eq('is_active', true)
        .gt('on_hand_qty', 0)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen
  });

  const selectedConsumable = consumables?.find(c => c.id === consumableId);

  const transferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      if (!selectedConsumable) {
        throw new Error('Please select a consumable');
      }

      if (quantity > selectedConsumable.on_hand_qty) {
        throw new Error('Transfer quantity cannot exceed available stock');
      }

      // Log the stock transfer as an adjustment
      const { error: logError } = await supabase
        .from('consumable_stock_adjustments')
        .insert({
          consumable_id: consumableId,
          adjustment_type: 'transfer',
          quantity_change: 0, // No net change for transfers
          previous_quantity: selectedConsumable.on_hand_qty,
          new_quantity: selectedConsumable.on_hand_qty,
          reason: `Transfer: ${fromLocation} → ${toLocation}`,
          notes: `${reason}. ${notes}`.trim(),
          adjusted_by: null // Will be set by auth context if available
        });

      if (logError) {
        console.error('Error logging transfer:', logError);
        throw logError;
      }

      return transferData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock transfer completed successfully",
      });
      handleReset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete stock transfer",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consumableId) {
      toast({
        title: "Validation Error",
        description: "Please select a consumable",
        variant: "destructive",
      });
      return;
    }

    if (!fromLocation.trim() || !toLocation.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both from and to locations",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reason for the transfer",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await transferMutation.mutateAsync({
        consumable_id: consumableId,
        quantity,
        from_location: fromLocation,
        to_location: toLocation,
        transfer_date: transferDate,
        reason,
        notes
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setConsumableId('');
    setQuantity(1);
    setFromLocation('');
    setToLocation('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Stock Transfer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consumable Selection */}
          <div className="space-y-2">
            <Label htmlFor="consumable">Consumable</Label>
            <Select value={consumableId} onValueChange={setConsumableId}>
              <SelectTrigger>
                <SelectValue placeholder="Select consumable to transfer" />
              </SelectTrigger>
              <SelectContent>
                {consumables?.map((consumable) => (
                  <SelectItem key={consumable.id} value={consumable.id}>
                    {consumable.name} (Available: {consumable.on_hand_qty})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Transfer</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedConsumable?.on_hand_qty || 999999}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
            {selectedConsumable && (
              <p className="text-sm text-muted-foreground">
                Available: {selectedConsumable.on_hand_qty} units
              </p>
            )}
          </div>

          {/* Transfer Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="space-y-2">
                  <Label htmlFor="fromLocation">From Location</Label>
                  <Input
                    id="fromLocation"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    placeholder="e.g., Warehouse A"
                    required
                  />
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="toLocation">To Location</Label>
                  <Input
                    id="toLocation"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    placeholder="e.g., Warehouse B"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferDate">Transfer Date</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Reason and Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Transfer</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rebalancing">Stock Rebalancing</SelectItem>
                  <SelectItem value="relocation">Location Relocation</SelectItem>
                  <SelectItem value="maintenance">Maintenance/Repair</SelectItem>
                  <SelectItem value="customer_request">Customer Request</SelectItem>
                  <SelectItem value="seasonal">Seasonal Adjustment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional details about this transfer..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Complete Transfer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};