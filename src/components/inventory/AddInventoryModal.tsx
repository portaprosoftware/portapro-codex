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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { StorageLocationSelector } from "./StorageLocationSelector";
import { toast } from "sonner";
import { Package, MapPin, Hash, DollarSign } from "lucide-react";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductFormData {
  name: string;
  description: string;
  defaultPricePerDay: number;
  stockTotal: number;
  lowStockThreshold: number;
  storageLocationId: string;
  locationQuantity: number;
  createIndividualItems: boolean;
  trackingMethod: 'bulk' | 'individual' | 'both';
}

export function AddInventoryModal({ isOpen, onClose }: AddInventoryModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    defaultPricePerDay: 0,
    stockTotal: 0,
    lowStockThreshold: 5,
    storageLocationId: '',
    locationQuantity: 0,
    createIndividualItems: false,
    trackingMethod: 'bulk'
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // 1. Create the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description,
          default_price_per_day: data.defaultPricePerDay,
          stock_total: data.stockTotal,
          low_stock_threshold: data.lowStockThreshold,
          track_inventory: true,
          default_storage_location_id: data.storageLocationId
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Create or update location stock entry
      if (data.storageLocationId && data.locationQuantity > 0) {
        const { error: stockError } = await supabase
          .from('product_location_stock')
          .upsert({
            product_id: product.id,
            storage_location_id: data.storageLocationId,
            quantity: data.locationQuantity
          }, {
            onConflict: 'product_id,storage_location_id'
          });

        if (stockError) throw stockError;
      }

      // 3. Optionally create individual items
      if (data.createIndividualItems && data.locationQuantity > 0) {
        const individualItems = Array.from({ length: data.locationQuantity }, (_, index) => ({
          product_id: product.id,
          item_code: `${product.id.slice(0, 8).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
          status: 'available',
          current_storage_location_id: data.storageLocationId
        }));

        const { error: itemsError } = await supabase
          .from('product_items')
          .insert(individualItems);

        if (itemsError) throw itemsError;
      }

      return product;
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-location-stock'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast.error("Failed to create product");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    
    if (!formData.storageLocationId) {
      toast.error("Please select a storage location");
      return;
    }

    if (formData.locationQuantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // Set stock total to match location quantity for new products
    const submitData = {
      ...formData,
      stockTotal: formData.locationQuantity
    };

    createProductMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      defaultPricePerDay: 0,
      stockTotal: 0,
      lowStockThreshold: 5,
      storageLocationId: '',
      locationQuantity: 0,
      createIndividualItems: false,
      trackingMethod: 'bulk'
    });
    onClose();
  };

  const updateFormData = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Inventory Product
          </DialogTitle>
          <DialogDescription>
            Create a new product and assign it to a storage location. Choose between bulk tracking, individual item tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Product Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Product Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="e.g., Standard Porta Potty"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Optional product description..."
                rows={3}
              />
            </div>

          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="defaultPricePerDay">Default Price Per Day</Label>
              <Input
                id="defaultPricePerDay"
                type="number"
                min="0"
                step="0.01"
                value={formData.defaultPricePerDay}
                onChange={(e) => updateFormData('defaultPricePerDay', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <Separator />

          {/* Storage & Inventory */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Storage & Inventory
            </h3>
            <p className="text-sm text-muted-foreground">
              Set initial stock for one location. You can split inventory between multiple locations after creating the product.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Storage Location *</Label>
                <StorageLocationSelector
                  value={formData.storageLocationId}
                  onValueChange={(value) => updateFormData('storageLocationId', value)}
                  placeholder="Select where this inventory will be stored"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationQuantity">Initial Quantity *</Label>
                  <Input
                    id="locationQuantity"
                    type="number"
                    min="1"
                    value={formData.locationQuantity}
                    onChange={(e) => updateFormData('locationQuantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => updateFormData('lowStockThreshold', parseInt(e.target.value) || 0)}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tracking Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Item Tracking
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="createIndividualItems">Create Individual Tracking Items</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate individual items with unique codes for detailed tracking
                  </p>
                </div>
                <Switch
                  id="createIndividualItems"
                  checked={formData.createIndividualItems}
                  onCheckedChange={(checked) => updateFormData('createIndividualItems', checked)}
                />
              </div>

              {formData.createIndividualItems && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Individual Item Codes</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.locationQuantity} individual items will be created with codes like:{' '}
                    <code className="bg-background px-1 py-0.5 rounded text-xs">
                      1001, 1002, etc.
                    </code>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createProductMutation.isPending}
            >
              {createProductMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}