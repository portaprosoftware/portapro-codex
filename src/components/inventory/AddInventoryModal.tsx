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

import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StorageLocationSelector } from "./StorageLocationSelector";
import { ItemCodeCategorySelect } from "@/components/ui/ItemCodeCategorySelect";
import { toast } from "sonner";
import { Package, MapPin, Hash, DollarSign } from "lucide-react";
import { ProductImageUploader } from "./ProductImageUploader";
import { uploadProductImage } from "@/utils/imageUpload";
import { PRODUCT_TYPES, ProductType } from "@/lib/productTypes";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductFormData {
  name: string;
  manufacturer: string;
  description: string;
  defaultPricePerDay: number;
  stockTotal: number;
  lowStockThreshold: number;
  storageLocationId: string;
  locationQuantity: number;
  selectedCategory: string;
  productType: ProductType;
  productVariant: string;
  imageFile?: File | null;
}

export function AddInventoryModal({ isOpen, onClose }: AddInventoryModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    manufacturer: '',
    description: '',
    defaultPricePerDay: 0,
    stockTotal: 0,
    lowStockThreshold: 5,
    storageLocationId: '',
    locationQuantity: 0,
    selectedCategory: '',
    productType: 'standard_toilet' as ProductType,
    productVariant: '',
    imageFile: null,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // 1. Create the product (image_url set later if image uploaded)
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          manufacturer: data.manufacturer || null,
          description: data.description,
          default_price_per_day: data.defaultPricePerDay,
          stock_total: data.stockTotal,
          low_stock_threshold: data.lowStockThreshold,
          track_inventory: true,
          default_storage_location_id: data.storageLocationId,
          default_item_code_category: data.selectedCategory || null,
          product_type: data.productType,
          product_variant: data.productVariant || null,
          image_url: null
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. If image selected, upload and update image_url
      if (data.imageFile) {
        const uploaded = await uploadProductImage(data.imageFile, {
          productId: product.id,
          productName: product.name,
          subfolder: "products",
        });
        const { error: imgErr } = await supabase
          .from('products')
          .update({ image_url: uploaded.publicUrl })
          .eq('id', product.id);
        if (imgErr) throw imgErr;
      }

      // 3. Create or update location stock entry
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

      // 4. Always create individual tracked items
      if (data.locationQuantity > 0) {
        if (!data.selectedCategory) {
          throw new Error('Item code category is required');
        }

        const individualItems = [];
        for (let i = 0; i < data.locationQuantity; i++) {
          const { data: itemCode, error: codeError } = await supabase
            .rpc('generate_item_code_with_category', {
              category_prefix: data.selectedCategory
            });
          if (codeError) throw codeError;

          individualItems.push({
            product_id: product.id,
            item_code: itemCode,
            status: 'available',
            current_storage_location_id: data.storageLocationId
          });
        }

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

    if (!formData.selectedCategory) {
      toast.error("Please select an item code category");
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
      manufacturer: '',
      description: '',
      defaultPricePerDay: 0,
      stockTotal: 0,
      lowStockThreshold: 5,
      storageLocationId: '',
      locationQuantity: 0,
      selectedCategory: '',
      productType: 'standard_toilet' as ProductType,
      productVariant: '',
      imageFile: null,
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
            Create a new product and assign it to a storage location. All products will have individual tracking items created automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Product Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Product Information</h3>

            {/* NEW: Image uploader */}
            <ProductImageUploader
              initialUrl={null}
              onFileChange={(file) => updateFormData('imageFile', file)}
            />

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
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => updateFormData('manufacturer', e.target.value)}
                placeholder="Manufacturer (optional)"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Select value={formData.productType} onValueChange={(value) => updateFormData('productType', value as ProductType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productVariant">Product Variant</Label>
                <Input
                  id="productVariant"
                  value={formData.productVariant}
                  onChange={(e) => updateFormData('productVariant', e.target.value)}
                  placeholder="e.g., Foot Pump, Luxury"
                />
              </div>
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

          {/* Item Code Category */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Item Code Category
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Item Code Category *</Label>
                <ItemCodeCategorySelect
                  value={formData.selectedCategory}
                  onValueChange={(value) => updateFormData('selectedCategory', value)}
                  placeholder="Select item code category"
                />
                <p className="text-sm text-muted-foreground">
                  Individual tracking items will be created automatically with unique codes
                </p>
              </div>

              {formData.selectedCategory && formData.locationQuantity > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Individual Item Codes Preview</p>
                   <p className="text-sm text-muted-foreground">
                     {formData.locationQuantity} individual items will be created with sequential 4-digit codes starting from:{' '}
                     <code className="bg-background px-1 py-0.5 rounded text-xs">
                       {formData.selectedCategory}, {(parseInt(formData.selectedCategory) + 1).toString()}, etc.
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
