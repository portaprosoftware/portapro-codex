
import React, { useState } from "react";
import { X, QrCode, ExternalLink, Camera, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OCRPhotoCapture } from "./OCRPhotoCapture";
import { RequiredAttributesFields } from "./RequiredAttributesFields";
import { SimpleQRCode } from "./SimpleQRCode";
import { StorageLocationSelector } from "./StorageLocationSelector";

interface EditItemModalProps {
  itemId: string;
  onClose: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ itemId, onClose }) => {
  const queryClient = useQueryClient();
  const [showOCRCapture, setShowOCRCapture] = useState(false);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    status: "",
    condition: "",
    location: "",
    current_storage_location_id: "",
    color: "",
    size: "",
    material: "",
    notes: "",
    // Maintenance fields
    maintenance_reason: "",
    expected_return_date: "",
    maintenance_notes: "",
    // OCR fields
    tool_number: "",
    vendor_id: "",
    plastic_code: "",
    manufacturing_date: "",
    mold_cavity: ""
  });

  const { data: item, isLoading } = useQuery({
    queryKey: ["product-item", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_items")
        .select("*, tool_number, vendor_id, plastic_code, manufacturing_date, mold_cavity, ocr_confidence_score, verification_status, tracking_photo_url, product_id, maintenance_reason, expected_return_date, maintenance_notes, maintenance_start_date, current_storage_location_id")
        .eq("id", itemId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch product attributes
  const { data: productAttributes = [] } = useQuery({
    queryKey: ['product-attributes', item?.product_id],
    queryFn: async () => {
      if (!item?.product_id) return [];
      const { data, error } = await supabase
        .from('product_properties')
        .select('*')
        .eq('product_id', item.product_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!item?.product_id
  });

  // Fetch current item attributes
  const { data: itemAttributes = [] } = useQuery({
    queryKey: ['item-attributes', itemId],
    queryFn: async () => {
      // First get the item attributes
      const { data: attributes, error: attrError } = await supabase
        .from('product_item_attributes')
        .select('property_id, property_value')
        .eq('item_id', itemId);
      
      if (attrError) throw attrError;
      
      if (!attributes || attributes.length === 0) return [];

      // Then get the property details for each attribute
      const propertyIds = attributes.map(attr => attr.property_id);
      const { data: properties, error: propError } = await supabase
        .from('product_properties')
        .select('id, attribute_name, attribute_value')
        .in('id', propertyIds);
      
      if (propError) throw propError;

      // Combine the data
      return attributes.map(attr => {
        const property = properties?.find(p => p.id === attr.property_id);
        return {
          ...attr,
          product_properties: property
        };
      });
    }
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        status: item.status || "",
        condition: item.condition || "",
        location: item.location || "",
        current_storage_location_id: item.current_storage_location_id || "",
        color: item.color || "",
        size: item.size || "",
        material: item.material || "",
        notes: item.notes || "",
        // Maintenance fields
        maintenance_reason: item.maintenance_reason || "",
        expected_return_date: item.expected_return_date ? item.expected_return_date.split('T')[0] : "",
        maintenance_notes: item.maintenance_notes || "",
        // OCR fields
        tool_number: item.tool_number || "",
        vendor_id: item.vendor_id || "",
        plastic_code: item.plastic_code || "",
        manufacturing_date: item.manufacturing_date || "",
        mold_cavity: item.mold_cavity || ""
      });
    }
  }, [item]);

  React.useEffect(() => {
    if (itemAttributes.length > 0) {
      const attributes: Record<string, string> = {};
      itemAttributes.forEach(attr => {
        if (attr.product_properties) {
          const attrName = attr.product_properties.attribute_name.toLowerCase();
          attributes[attrName] = attr.property_value;
        }
      });
      setAttributeValues(attributes);
    }
  }, [itemAttributes]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: typeof formData) => {
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

      // Prepare update data, handling empty date strings properly
      const cleanUpdateData = { ...updateData };
      
      // Convert empty date strings to null for PostgreSQL
      if (cleanUpdateData.expected_return_date === "") {
        cleanUpdateData.expected_return_date = null;
      }

      const { error } = await supabase
        .from("product_items")
        .update(cleanUpdateData)
        .eq("id", itemId);
      
      if (error) throw error;

      // Update item attributes
      if (Object.keys(attributeValues).length > 0) {
        // First, delete existing attributes
        await supabase
          .from('product_item_attributes')
          .delete()
          .eq('item_id', itemId);

        // Then insert new attributes
        const attributeRecords = [];
        for (const [attrName, attrValue] of Object.entries(attributeValues)) {
          if (attrValue) {
            const property = productAttributes.find(attr => 
              attr.attribute_name.toLowerCase() === attrName && 
              attr.attribute_value === attrValue
            );
            
            if (property) {
              attributeRecords.push({
                item_id: itemId,
                property_id: property.id,
                property_value: attrValue
              });
            }
          }
        }

        if (attributeRecords.length > 0) {
          const { error: attrError } = await supabase
            .from('product_item_attributes')
            .insert(attributeRecords);
          
          if (attrError) {
            console.error('Error saving attributes:', attrError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-items"] });
      toast.success("Item updated successfully");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update item");
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleOCRComplete = (ocrData: any) => {
    console.log('OCR completed for edit:', ocrData);
    
    // Update form with OCR results
    if (ocrData.toolNumber) handleInputChange("tool_number", ocrData.toolNumber);
    if (ocrData.vendorId) handleInputChange("vendor_id", ocrData.vendorId);
    if (ocrData.plasticCode) handleInputChange("plastic_code", ocrData.plasticCode);
    if (ocrData.manufacturingDate) handleInputChange("manufacturing_date", ocrData.manufacturingDate);
    if (ocrData.moldCavity) handleInputChange("mold_cavity", ocrData.moldCavity);
    
    setShowOCRCapture(false);
    toast.success("OCR data captured and applied");
  };


  if (isLoading || !item) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="p-6">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Item: {item.item_code}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status {formData.status === "maintenance" ? "(Auto-locked)" : ""}</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange("status", value)}
                disabled={formData.status === "maintenance"}
              >
                <SelectTrigger className={formData.status === "maintenance" ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">On Job</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Permanently Retired</SelectItem>
                </SelectContent>
              </Select>
              {formData.status === "maintenance" && (
                <p className="text-xs text-muted-foreground mt-1">Status locked while unit is in maintenance</p>
              )}
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
            <Label htmlFor="storage_location">Storage Location</Label>
            <StorageLocationSelector
              value={formData.current_storage_location_id}
              onValueChange={(value) => handleInputChange("current_storage_location_id", value)}
              placeholder="Select storage location"
            />
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

          {/* QR Code Section */}
          <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-gray-600" />
                <Label className="font-medium text-gray-900">QR Code</Label>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              QR code contains: {item.qr_code_data || item.item_code}
            </p>
            {item.qr_code_data && (
              <SimpleQRCode 
                itemCode={item.item_code} 
                qrCodeData={item.qr_code_data}
                showAsButton={false}
              />
            )}
          </div>

          {/* Required Attributes */}
          <RequiredAttributesFields
            productId={item?.product_id || ""}
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
                <p className="text-sm text-muted-foreground">Capture or update tool information using OCR</p>
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
                  placeholder="e.g., CAV 1"
                />
              </div>

              {item?.ocr_confidence_score && (
                <div className="space-y-2">
                  <Label>OCR Confidence</Label>
                  <div className="px-3 py-2 bg-white border rounded-md text-sm font-mono">
                    {Math.round(item.ocr_confidence_score * 100)}%
                  </div>
                </div>
              )}
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
              disabled={updateMutation.isPending || Object.keys(attributeErrors).length > 0}
            >
              {updateMutation.isPending ? "Updating..." : "Update Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* OCR Photo Capture Modal */}
      {showOCRCapture && item && (
        <OCRPhotoCapture
          open={showOCRCapture}
          onClose={() => setShowOCRCapture(false)}
          itemId={item.id}
          itemCode={item.item_code}
          onComplete={handleOCRComplete}
        />
      )}
    </Dialog>
  );
};
