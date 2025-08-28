import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StorageLocationSelector } from "./StorageLocationSelector";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";

interface BulkLocationTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItemIds: string[];
  productName: string;
}

export function BulkLocationTransferModal({
  isOpen,
  onClose,
  selectedItemIds,
  productName
}: BulkLocationTransferModalProps) {
  const queryClient = useQueryClient();
  const [newLocationId, setNewLocationId] = useState("");
  const [notes, setNotes] = useState("");

  const bulkTransferMutation = useMutation({
    mutationFn: async ({ itemIds, locationId, transferNotes }: { 
      itemIds: string[]; 
      locationId: string; 
      transferNotes?: string;
    }) => {
      // Get current locations for each item first
      const { data: currentItems, error: fetchError } = await supabase
        .from('product_items')
        .select('id, current_storage_location_id, product_id')
        .in('id', itemIds);
      
      if (fetchError) throw fetchError;

      // Update all selected items to new location
      const { error: updateError } = await supabase
        .from('product_items')
        .update({ 
          current_storage_location_id: locationId,
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds);
      
      if (updateError) throw updateError;

      // Log each transfer individually for history tracking
      const transfers = currentItems?.map(item => ({
        product_item_id: item.id,
        product_id: item.product_id,
        from_location_id: item.current_storage_location_id,
        to_location_id: locationId,
        transferred_at: new Date().toISOString(),
        notes: transferNotes || null,
        transferred_by: null // Could be set to current user ID if available
      })) || [];

      if (transfers.length > 0) {
        const { error: logError } = await supabase
          .from('product_item_location_transfers')
          .insert(transfers);
        
        if (logError) {
          console.error('Error logging transfers:', logError);
          // Don't throw error here as the main transfer succeeded
        }
      }
      
      return itemIds.length;
    },
    onSuccess: (transferredCount) => {
      toast.success(`Successfully transferred ${transferredCount} item${transferredCount > 1 ? 's' : ''} to new location`);
      queryClient.invalidateQueries({ queryKey: ["product-items"] });
      queryClient.invalidateQueries({ queryKey: ["individual-units-count"] });
      queryClient.invalidateQueries({ queryKey: ["product-individual-location-stock"] });
      queryClient.invalidateQueries({ queryKey: ["product-location-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["available-individual-units-by-location"] });
      onClose();
      setNewLocationId("");
      setNotes("");
    },
    onError: (error) => {
      console.error('Error transferring items:', error);
      toast.error('Failed to transfer items');
    }
  });

  const handleTransfer = () => {
    if (!newLocationId) {
      toast.error("Please select a destination location");
      return;
    }

    if (selectedItemIds.length === 0) {
      toast.error("No items selected for transfer");
      return;
    }

    bulkTransferMutation.mutate({
      itemIds: selectedItemIds,
      locationId: newLocationId,
      transferNotes: notes
    });
  };

  const handleClose = () => {
    setNewLocationId("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Transfer Items to Location
          </DialogTitle>
          <DialogDescription>
            Move {selectedItemIds.length} selected {productName} item{selectedItemIds.length > 1 ? 's' : ''} to a new storage location
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destination Location</Label>
            <StorageLocationSelector
              value={newLocationId}
              onValueChange={setNewLocationId}
              placeholder="Select new location"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Transfer Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this transfer"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={bulkTransferMutation.isPending || !newLocationId}
            >
              {bulkTransferMutation.isPending 
                ? "Transferring..." 
                : `Transfer ${selectedItemIds.length} Item${selectedItemIds.length > 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}