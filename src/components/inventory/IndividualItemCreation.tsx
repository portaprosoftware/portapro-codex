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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StorageLocationSelector } from "./StorageLocationSelector";
import { ItemCodeCategorySelect } from "@/components/ui/ItemCodeCategorySelect";
import { ProductVariationsFields } from "./ProductVariationsFields";
import { OCRPhotoCapture } from "./OCRPhotoCapture";
import { toast } from "sonner";
import { Package, ArrowRight, QrCode, Camera, AlertTriangle } from "lucide-react";

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
  const [showOCRCapture, setShowOCRCapture] = useState(false);
  
  // Form data state matching edit modal
  const [formData, setFormData] = useState({
    status: "available",
    condition: "excellent",
    // Maintenance fields
    maintenance_reason: "",
    expected_return_date: "",
    maintenance_notes: "",
    // OCR fields
    tool_number: "",
    vendor_id: "",
    plastic_code: "",
    manufacturing_date: "",
    mold_cavity: "",
    // General notes
    notes: ""
  });

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
      
      // Validate storage location for maintenance status
      if (formData.status === "maintenance" && !storageLocationId) {
        throw new Error("Storage location is required when creating items with maintenance status");
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

      // Prepare update data, handling empty date strings properly
      const cleanFormData = { ...formData };
      if (cleanFormData.expected_return_date === "") {
        cleanFormData.expected_return_date = null;
      }

      // Create individual items with all form data
      const individualItems = itemCodes.map((itemCode) => ({
        product_id: productId,
        item_code: itemCode,
        status: formData.status,
        condition: formData.condition,
        current_storage_location_id: storageLocationId,
        // Maintenance fields
        maintenance_reason: formData.maintenance_reason || null,
        expected_return_date: cleanFormData.expected_return_date,
        maintenance_notes: formData.maintenance_notes || null,
        // OCR fields
        tool_number: formData.tool_number || null,
        vendor_id: formData.vendor_id || null,
        plastic_code: formData.plastic_code || null,
        manufacturing_date: formData.manufacturing_date || null,
        mold_cavity: formData.mold_cavity || null,
        // General notes
        notes: formData.notes || null
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
    setShowOCRCapture(false);
    setFormData({
      status: "available",
      condition: "excellent",
      maintenance_reason: "",
      expected_return_date: "",
      maintenance_notes: "",
      tool_number: "",
      vendor_id: "",
      plastic_code: "",
      manufacturing_date: "",
      mold_cavity: "",
      notes: ""
    });
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOCRComplete = (ocrData: any) => {
    console.log('OCR completed for creation:', ocrData);
    
    // Update form with OCR results
    if (ocrData.toolNumber) handleInputChange("tool_number", ocrData.toolNumber);
    if (ocrData.vendorId) handleInputChange("vendor_id", ocrData.vendorId);
    if (ocrData.plasticCode) handleInputChange("plastic_code", ocrData.plasticCode);
    if (ocrData.manufacturingDate) handleInputChange("manufacturing_date", ocrData.manufacturingDate);
    if (ocrData.moldCavity) handleInputChange("mold_cavity", ocrData.moldCavity);
    
    setShowOCRCapture(false);
    toast.success("OCR data captured and applied");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Create Individual Items
          </DialogTitle>
          <DialogDescription>
            Generate {quantity} individual tracking item{quantity > 1 ? 's' : ''} for {productName} with unique QR codes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quantity and Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Storage Location *{formData.status === "maintenance" ? " (Required for maintenance)" : ""}</Label>
                <StorageLocationSelector
                  value={storageLocationId}
                  onValueChange={setStorageLocationId}
                  placeholder={formData.status === "maintenance" ? "Storage location required for maintenance" : "Select where these items will be stored"}
                />
                {formData.status === "maintenance" && !storageLocationId && (
                  <p className="text-xs text-red-600">Storage location is mandatory when creating maintenance items</p>
                )}
              </div>
            </div>

            {/* Item Code Category Selection */}
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
          </div>

          {/* Status and Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Permanently Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="needs_repair">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maintenance Fields - only show if status is maintenance */}
          {formData.status === "maintenance" && (
            <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-foreground" />
                <Label className="font-medium text-foreground">Maintenance Information</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance_reason">Maintenance Reason</Label>
                  <Input
                    id="maintenance_reason"
                    value={formData.maintenance_reason}
                    onChange={(e) => handleInputChange("maintenance_reason", e.target.value)}
                    placeholder="Reason for maintenance"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_return_date">Expected Return Date</Label>
                  <Input
                    id="expected_return_date"
                    type="date"
                    value={formData.expected_return_date}
                    onChange={(e) => handleInputChange("expected_return_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
                <Textarea
                  id="maintenance_notes"
                  value={formData.maintenance_notes}
                  onChange={(e) => handleInputChange("maintenance_notes", e.target.value)}
                  placeholder="Additional maintenance details..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Product Variations */}
          <ProductVariationsFields
            productId={productId}
            attributes={productAttributes}
            values={attributeValues}
            onChange={handleAttributeChange}
            errors={attributeErrors}
          />

          {/* OCR Tool Tracking Section */}
          <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Tool Tracking Information
                </h3>
                <p className="text-sm text-muted-foreground">Capture or manually enter tool information using OCR</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOCRCapture(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                {formData.tool_number ? "Update OCR" : "Scan Tool Info"}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tool_number">Tool Number</Label>
                <Input
                  id="tool_number"
                  value={formData.tool_number}
                  onChange={(e) => handleInputChange("tool_number", e.target.value)}
                  placeholder="e.g., T-20788-1A"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_id">Vendor ID</Label>
                <Input
                  id="vendor_id"
                  value={formData.vendor_id}
                  onChange={(e) => handleInputChange("vendor_id", e.target.value)}
                  placeholder="e.g., 32933"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plastic_code">Plastic Code</Label>
                <Input
                  id="plastic_code"
                  value={formData.plastic_code}
                  onChange={(e) => handleInputChange("plastic_code", e.target.value)}
                  placeholder="e.g., 2 HDPE"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturing_date">Mfg Date</Label>
                <Input
                  id="manufacturing_date"
                  value={formData.manufacturing_date}
                  onChange={(e) => handleInputChange("manufacturing_date", e.target.value)}
                  placeholder="e.g., 01/24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mold_cavity">Mold Cavity</Label>
                <Input
                  id="mold_cavity"
                  value={formData.mold_cavity}
                  onChange={(e) => handleInputChange("mold_cavity", e.target.value)}
                  placeholder="e.g., 1"
                />
              </div>
            </div>
          </div>

          {/* General Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">General Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional notes about these items..."
              rows={3}
            />
          </div>

          {/* Individual Tracking Info */}
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

          {/* Form Actions */}
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

        {/* OCR Photo Capture Modal */}
        {showOCRCapture && (
          <OCRPhotoCapture
            open={showOCRCapture}
            itemId="" // Empty for creation
            itemCode="NEW_ITEM"
            onComplete={handleOCRComplete}
            onClose={() => setShowOCRCapture(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}