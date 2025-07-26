import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StorageLocationSelector } from "./StorageLocationSelector";
import { toast } from "sonner";
import { MapPin, Move } from "lucide-react";

interface ItemTransferModalProps {
  itemId: string;
  itemCode: string;
  currentLocationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemTransferModal({ 
  itemId, 
  itemCode, 
  currentLocationId, 
  isOpen, 
  onClose 
}: ItemTransferModalProps) {
  const queryClient = useQueryClient();
  const [newLocationId, setNewLocationId] = useState("");

  const transferItemMutation = useMutation({
    mutationFn: async () => {
      if (!newLocationId || newLocationId === currentLocationId) {
        throw new Error("Please select a different location");
      }

      // Update item location
      const { error } = await supabase
        .from('product_items')
        .update({ 
          current_storage_location_id: newLocationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      return { itemId, newLocationId };
    },
    onSuccess: () => {
      toast.success(`Item ${itemCode} transferred successfully`);
      queryClient.invalidateQueries({ queryKey: ['product-items'] });
      queryClient.invalidateQueries({ queryKey: ['individual-units'] });
      queryClient.invalidateQueries({ queryKey: ['product-location-stock'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error transferring item:', error);
      toast.error("Failed to transfer item");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    transferItemMutation.mutate();
  };

  const handleClose = () => {
    setNewLocationId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Transfer Item
          </DialogTitle>
          <DialogDescription>
            Move item {itemCode} to a different storage location
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Current location will be updated</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Storage Location *</label>
              <StorageLocationSelector
                value={newLocationId}
                onValueChange={setNewLocationId}
                placeholder="Select destination location"
                excludeLocationId={currentLocationId}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={transferItemMutation.isPending || !newLocationId}
            >
              {transferItemMutation.isPending ? "Transferring..." : "Transfer Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}