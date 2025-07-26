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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageLocationSelector } from "./StorageLocationSelector";
import { toast } from "sonner";
import { Package, ArrowRight, QrCode } from "lucide-react";

interface IndividualItemCreationProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IndividualItemCreation({ 
  productId, 
  productName, 
  isOpen, 
  onClose 
}: IndividualItemCreationProps) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [storageLocationId, setStorageLocationId] = useState("");
  const [itemPrefix, setItemPrefix] = useState("");

  const createIndividualItemsMutation = useMutation({
    mutationFn: async () => {
      if (!storageLocationId || quantity <= 0) {
        throw new Error("Please select storage location and valid quantity");
      }

      // Get next sequence number for item codes
      const { data: existingItems } = await supabase
        .from('product_items')
        .select('item_code')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1);

      let startingNumber = 1;
      if (existingItems && existingItems.length > 0) {
        const lastCode = existingItems[0].item_code;
        const matches = lastCode.match(/-(\d+)$/);
        if (matches) {
          startingNumber = parseInt(matches[1]) + 1;
        }
      }

      // Generate individual items
      const prefix = itemPrefix || productId.slice(0, 8).toUpperCase();
      const individualItems = Array.from({ length: quantity }, (_, index) => ({
        product_id: productId,
        item_code: `${prefix}-${String(startingNumber + index).padStart(3, '0')}`,
        status: 'available',
        current_storage_location_id: storageLocationId
      }));

      const { error } = await supabase
        .from('product_items')
        .insert(individualItems);

      if (error) throw error;

      // Update product location stock
      const { data: existingStock } = await supabase
        .from('product_location_stock')
        .select('quantity')
        .eq('product_id', productId)
        .eq('storage_location_id', storageLocationId)
        .single();

      const newQuantity = (existingStock?.quantity || 0) + quantity;

      await supabase
        .from('product_location_stock')
        .upsert({
          product_id: productId,
          storage_location_id: storageLocationId,
          quantity: newQuantity
        }, {
          onConflict: 'product_id,storage_location_id'
        });

      return individualItems;
    },
    onSuccess: (items) => {
      toast.success(`Created ${items.length} individual tracking items`);
      queryClient.invalidateQueries({ queryKey: ['product-items', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-location-stock', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating individual items:', error);
      toast.error("Failed to create individual items");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIndividualItemsMutation.mutate();
  };

  const handleClose = () => {
    setQuantity(1);
    setStorageLocationId("");
    setItemPrefix("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Create Individual Items
          </DialogTitle>
          <DialogDescription>
            Generate individual tracking items for {productName} with unique QR codes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Number of Items to Create</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Storage Location *</Label>
              <StorageLocationSelector
                value={storageLocationId}
                onValueChange={setStorageLocationId}
                placeholder="Select where these items will be stored"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemPrefix">Item Code Prefix (Optional)</Label>
              <Input
                id="itemPrefix"
                value={itemPrefix}
                onChange={(e) => setItemPrefix(e.target.value.toUpperCase())}
                placeholder="AUTO (auto-generated)"
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Items will be coded as: {itemPrefix || 'AUTO'}-001, {itemPrefix || 'AUTO'}-002, etc.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <Package className="h-5 w-5 text-muted-foreground" />
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <QrCode className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Individual Tracking</p>
              <p className="text-xs text-muted-foreground">
                Each item will have a unique QR code for detailed tracking
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createIndividualItemsMutation.isPending}
            >
              {createIndividualItemsMutation.isPending ? "Creating..." : `Create ${quantity} Items`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}