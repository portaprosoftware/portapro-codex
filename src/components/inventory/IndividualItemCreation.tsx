import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { RequiredAttributesFields } from "./RequiredAttributesFields";
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
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});

  // Fetch product info and attributes
  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("name, default_item_code_category")
        .eq("id", productId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: productAttributes = [] } = useQuery({
    queryKey: ['product-attributes', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_properties')
        .select('*')
        .eq('product_id', productId);
      
      if (error) throw error;
      return data;
    }
  });

  const createIndividualItemsMutation = useMutation({
    mutationFn: async () => {
      if (!storageLocationId || quantity <= 0) {
        throw new Error("Please select storage location and valid quantity");
      }
      
      // Check for category - either default or selected
      const categoryToUse = product?.default_item_code_category || selectedCategory;
      
      if (!categoryToUse) {
        throw new Error("Please select an item code category or set a default for this product");
      }

      // Validate required attributes
      const requiredAttributes = productAttributes.filter(attr => attr.is_required);
      const validationErrors: Record<string, string> = {};
      
      requiredAttributes.forEach(attr => {
        const fieldKey = attr.attribute_name.toLowerCase();
        if (!attributeValues[fieldKey]) {
          validationErrors[fieldKey] = `${attr.attribute_name} is required`;
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setAttributeErrors(validationErrors);
        throw new Error("Please fill in all required attributes");
      }

      setAttributeErrors({});

      const itemCodes = [];
      

      // Generate item codes using the actual generation function (increments counter)
      for (let i = 0; i < quantity; i++) {
        const { data: generatedCode, error: codeError } = await supabase
          .rpc('generate_item_code_with_category', {
            category_prefix: categoryToUse
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

      const { data: createdItems, error } = await supabase
        .from('product_items')
        .insert(individualItems)
        .select('id');

      if (error) throw error;

      // Save attribute values for each created item
      if (createdItems && Object.keys(attributeValues).length > 0) {
        const attributeRecords = [];
        
        for (const item of createdItems) {
          for (const [attrName, attrValue] of Object.entries(attributeValues)) {
            if (attrValue) {
              // Find the property ID for this attribute name and value
              const property = productAttributes.find(attr => 
                attr.attribute_name.toLowerCase() === attrName && 
                attr.attribute_value === attrValue
              );
              
              if (property) {
                attributeRecords.push({
                  item_id: item.id,
                  property_id: property.id,
                  property_value: attrValue
                });
              }
            }
          }
        }

        if (attributeRecords.length > 0) {
          const { error: attrError } = await supabase
            .from('product_item_attributes')
            .insert(attributeRecords);
          
          if (attrError) {
            console.error('Error saving attributes:', attrError);
            // Don't fail the entire operation for attribute errors
          }
        }
      }

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
    setAttributeValues({});
    setAttributeErrors({});
    onClose();
  };

  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues(prev => ({ ...prev, [attributeId]: value }));
    // Clear error when user selects a value
    if (attributeErrors[attributeId]) {
      setAttributeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[attributeId];
        return newErrors;
      });
    }
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

            {!product?.default_item_code_category && (
              <div className="space-y-2">
                <Label>Item Code Category *</Label>
                <ItemCodeCategorySelect
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  placeholder="Select category for 4-digit codes"
                />
              </div>
            )}

            {product?.default_item_code_category && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">
                  Using default category: {product.default_item_code_category}s
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Item codes will be generated automatically using this category.
                </p>
              </div>
            )}
            
            <div className="space-y-2 hidden">
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

            {/* Required Attributes */}
            <RequiredAttributesFields
              productId={productId}
              attributes={productAttributes}
              values={attributeValues}
              onChange={handleAttributeChange}
              errors={attributeErrors}
            />
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
              disabled={createIndividualItemsMutation.isPending || (!product?.default_item_code_category && !selectedCategory) || !storageLocationId || Object.keys(attributeErrors).length > 0}
            >
              {createIndividualItemsMutation.isPending ? "Creating..." : `Create ${quantity} Items`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}