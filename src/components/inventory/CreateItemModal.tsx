import React, { useState, useEffect } from "react";
import { Plus, Camera, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OCRPhotoCapture } from "./OCRPhotoCapture";
import { useItemCodeCategories } from "@/hooks/useCompanySettings";
import { ItemCodeCategorySelect } from "@/components/ui/ItemCodeCategorySelect";
import { RequiredAttributesFields } from "./RequiredAttributesFields";

interface CreateItemModalProps {
  productId: string;
  onClose: () => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({ productId, onClose }) => {
  const queryClient = useQueryClient();
  const [showOCRCapture, setShowOCRCapture] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    item_code: "",
    status: "available",
    condition: "excellent",
    location: "",
    notes: "",
    // OCR fields
    tool_number: "",
    vendor_id: "",
    plastic_code: "",
    manufacturing_date: "",
    mold_cavity: ""
  });

  // Get item code categories
  const { categories, isLoading: categoriesLoading } = useItemCodeCategories();

  // Get product info for auto-generating item codes
  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("name")
        .eq("id", productId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch product attributes
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

  // Get existing items count for auto-generating codes
  const { data: itemsCount } = useQuery({
    queryKey: ["product-items-count", productId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("product_items")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (itemData: typeof formData) => {
      console.log('Creating item with data:', itemData);
      
      // Validate required attributes
      const requiredAttributes = productAttributes?.filter(attr => attr.is_required) || [];
      const missingAttributes: Record<string, string> = {};
      
      requiredAttributes.forEach(attr => {
        const fieldKey = attr.attribute_name.toLowerCase();
        if (!attributeValues[fieldKey]?.trim()) {
          missingAttributes[fieldKey] = `${attr.attribute_name} is required`;
        }
      });

      if (Object.keys(missingAttributes).length > 0) {
        setAttributeErrors(missingAttributes);
        throw new Error("Please fill in all required attributes");
      }

      setAttributeErrors({});

      // Insert the item
      const { data: newItem, error } = await supabase
        .from("product_items")
        .insert({
          product_id: productId,
          ...itemData
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Item created successfully:', newItem);

      // Insert attributes if any
      if (Object.keys(attributeValues).length > 0) {
        const attributeRecords = [];
        for (const [key, value] of Object.entries(attributeValues)) {
          if (value.trim()) {
            // Find the corresponding property ID
            const property = productAttributes?.find(
              attr => attr.attribute_name.toLowerCase() === key
            );
            if (property) {
              attributeRecords.push({
                item_id: newItem.id,
                property_id: property.id,
                property_value: value
              });
            }
          }
        }

        if (attributeRecords.length > 0) {
          const { error: attrError } = await supabase
            .from('product_item_attributes')
            .insert(attributeRecords);
          
          if (attrError) throw attrError;
        }
      }
    },
    onSuccess: () => {
      console.log('Item creation successful');
      queryClient.invalidateQueries({ queryKey: ["product-items"] });
      queryClient.invalidateQueries({ queryKey: ["product-items", productId] });
      toast.success("Item created successfully");
      onClose();
    },
    onError: (error: any) => {
      console.error('Item creation failed:', error);
      if (error.message !== "Please fill in all required attributes") {
        toast.error(`Failed to create item: ${error.message}`);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_code.trim()) {
      toast.error("Item code is required");
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues(prev => ({ ...prev, [attributeId]: value }));
    // Clear errors when user starts typing
    if (attributeErrors[attributeId]) {
      setAttributeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[attributeId];
        return newErrors;
      });
    }
  };

  const generateItemCode = () => {
    if (categoriesLoading || !categories || categories.length === 0) {
      toast.error("Item code categories not available");
      return;
    }
    setShowCategorySelect(true);
  };

  const handleCategorySelect = async (categoryPrefix: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_item_code_with_category', {
        category_prefix: categoryPrefix
      });

      if (error) throw error;
      
      handleInputChange("item_code", data);
      setShowCategorySelect(false);
      toast.success("Item code generated successfully");
    } catch (error) {
      console.error('Error generating item code:', error);
      toast.error("Failed to generate item code");
    }
  };

  const handleOCRComplete = (ocrData: any) => {
    console.log('OCR completed:', ocrData);
    
    // Update form with OCR results
    if (ocrData.toolNumber) handleInputChange("tool_number", ocrData.toolNumber);
    if (ocrData.vendorId) handleInputChange("vendor_id", ocrData.vendorId);
    if (ocrData.plasticCode) handleInputChange("plastic_code", ocrData.plasticCode);
    if (ocrData.manufacturingDate) handleInputChange("manufacturing_date", ocrData.manufacturingDate);
    if (ocrData.moldCavity) handleInputChange("mold_cavity", ocrData.moldCavity);
    
    setShowOCRCapture(false);
    toast.success("OCR data captured and applied to form");
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Item
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Code Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="item_code" className="font-medium text-gray-900">Item Code *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateItemCode}
                  disabled={categoriesLoading}
                >
                  Auto-Generate
                </Button>
              </div>
              <Input
                id="item_code"
                value={formData.item_code}
                onChange={(e) => handleInputChange("item_code", e.target.value)}
                placeholder="Enter unique item code (e.g., 1001, 2001)"
                required
              />
            </div>

            {/* Basic Information */}
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
                    <SelectItem value="maintenance">In Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Enter current location"
              />
            </div>

            {/* Product Variations */}
            <RequiredAttributesFields
              productId={productId}
              attributes={productAttributes || []}
              values={attributeValues}
              onChange={handleAttributeChange}
              errors={attributeErrors}
            />

            {/* OCR Tool Tracking Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Tool Tracking Information</h3>
                  <p className="text-sm text-gray-600">Use OCR to automatically capture tool information from photos</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOCRCapture(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Tool Info
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
                    placeholder="e.g., CAV 1"
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
                placeholder="Add any additional notes about this item..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Selection Modal */}
      {showCategorySelect && (
        <Dialog open={showCategorySelect} onOpenChange={setShowCategorySelect}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Item Code Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose a category to generate the item code:
              </p>
              <ItemCodeCategorySelect
                value=""
                onValueChange={handleCategorySelect}
                placeholder="Select a category"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCategorySelect(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* OCR Photo Capture Modal */}
      {showOCRCapture && (
        <OCRPhotoCapture
          open={showOCRCapture}
          onClose={() => setShowOCRCapture(false)}
          itemId="new" // Temporary ID for new items
          itemCode={formData.item_code || "NEW"}
          onComplete={handleOCRComplete}
        />
      )}
    </>
  );
};