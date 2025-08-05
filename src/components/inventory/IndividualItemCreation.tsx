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
import { ItemCodeCategorySelect } from "@/components/ui/ItemCodeCategorySelect";
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
  const [selectedCategory, setSelectedCategory] = useState("");

  const createIndividualItemsMutation = useMutation({
    mutationFn: async () => {
      if (!storageLocationId || quantity <= 0) {
        throw new Error("Please select storage location and valid quantity");
      }
      
      if (!selectedCategory) {
        throw new Error("Please select an item code category");
      }

      const itemCodes = [];
      
      // Generate item codes using the new database function
      for (let i = 0; i < quantity; i++) {
        const { data: generatedCode, error: codeError } = await supabase
          .rpc('generate_item_code_with_category', {
            category_prefix: selectedCategory
          });

        if (codeError) throw codeError;
        itemCodes.push(generatedCode);
      }

      // Create individual items
      const individualItems = itemCodes.map((itemCode) => ({
        product_id: productId,
        item_code: itemCode,
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
    setSelectedCategory("");
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
              <Label>Item Code Category *</Label>
              <ItemCodeCategorySelect
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                placeholder="Select category for 4-digit codes"
              />
              <p className="text-xs text-muted-foreground">
                Items will be coded with 4-digit numbers (e.g., 1001, 2045, 3012)
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
              disabled={createIndividualItemsMutation.isPending || !selectedCategory || !storageLocationId}
            >
              {createIndividualItemsMutation.isPending ? "Creating..." : `Create ${quantity} Items`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}