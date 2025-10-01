import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Minus } from 'lucide-react';

type InventoryItem = {
  id: string;
  item_name: string;
  current_stock: number;
};

type MarkItemUsedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
};

export function MarkItemUsedModal({ isOpen, onClose, item }: MarkItemUsedModalProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [quantityUsed, setQuantityUsed] = useState('1');
  const [notes, setNotes] = useState('');

  const markUsedMutation = useMutation({
    mutationFn: async () => {
      const qty = parseInt(quantityUsed);
      if (qty <= 0 || qty > item.current_stock) {
        throw new Error('Invalid quantity');
      }

      // Log usage
      const { error: logError } = await supabase
        .from('spill_kit_usage_log')
        .insert({
          inventory_item_id: item.id,
          quantity_used: qty,
          used_by_clerk: user?.id,
          notes: notes || null,
          used_at: new Date().toISOString(),
        });

      if (logError) throw logError;

      // Get current usage count first
      const { data: currentItem } = await supabase
        .from('spill_kit_inventory')
        .select('usage_count')
        .eq('id', item.id)
        .single();

      // Update inventory stock and usage stats
      const { error: updateError } = await supabase
        .from('spill_kit_inventory')
        .update({
          current_stock: item.current_stock - qty,
          last_usage_date: new Date().toISOString(),
          usage_count: (currentItem?.usage_count || 0) + 1,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kit-inventory'] });
      toast.success('Usage recorded successfully');
      onClose();
      setQuantityUsed('1');
      setNotes('');
    },
    onError: (error: any) => {
      toast.error(`Failed to record usage: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markUsedMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Item as Used</DialogTitle>
          <DialogDescription>
            Record usage for: <strong>{item.item_name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Used *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={item.current_stock}
              value={quantityUsed}
              onChange={(e) => setQuantityUsed(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Available stock: {item.current_stock}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Used during spill incident on Route 5..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={markUsedMutation.isPending}>
              {markUsedMutation.isPending ? 'Recording...' : 'Record Usage'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
