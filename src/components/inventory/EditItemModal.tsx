
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
import { LocationTransferConfirmDialog } from "./LocationTransferConfirmDialog";

interface EditItemModalProps {
  itemId: string;
  onClose: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ itemId, onClose }) => {
  const queryClient = useQueryClient();
  const [showOCRCapture, setShowOCRCapture] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<typeof formData | null>(null);
  const [locationNames, setLocationNames] = useState<{from?: string, to?: string}>({});
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

  // Auto-set condition to "needs_repair" when status is set to "maintenance"
  React.useEffect(() => {
    if (formData.status === "maintenance" && formData.condition !== "needs_repair") {
      setFormData(prev => ({ ...prev, condition: "needs_repair" }));
      toast.info("Condition automatically set to 'Needs Repair' for maintenance items");
    }
  }, [formData.status]);

  const updateMutation = useMutation({
    mutationFn: async (data: { updateData: typeof formData; recordTransfer?: boolean; transferNotes?: string }) => {
      const { updateData, recordTransfer, transferNotes } = data;
      
      console.log('EditItemModal mutation starting with data:', {
        updateData,
        recordTransfer,
        transferNotes,
        status: updateData.status
      });
      
      // Storage location is optional for maintenance status

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

      // Check if location changed to create transfer record
      const originalLocation = item?.current_storage_location_id;
      const newLocation = updateData.current_storage_location_id;
      const locationChanged = originalLocation !== newLocation;

      // Prepare update data, handling empty strings properly for PostgreSQL
      const cleanUpdateData = { ...updateData };
      
      // Convert empty date strings to null for PostgreSQL
      if (cleanUpdateData.expected_return_date === "") {
        cleanUpdateData.expected_return_date = null;
      }
      
      // Convert empty UUID strings to null for PostgreSQL
      if (cleanUpdateData.current_storage_location_id === "") {
        cleanUpdateData.current_storage_location_id = null;
      }
      
      // Clean date fields - convert empty strings to null
      if (cleanUpdateData.manufacturing_date === "") {
        cleanUpdateData.manufacturing_date = null;
      }
      
      console.log('Sending update data:', JSON.stringify(cleanUpdateData, null, 2));

      const { error } = await supabase
        .from("product_items")
        .update(cleanUpdateData)
        .eq("id", itemId);
      
      if (error) throw error;

      // Create transfer record if location changed and user confirmed
      if (locationChanged && recordTransfer && item?.product_id) {
        const { error: transferError } = await supabase
          .from('product_item_location_transfers')
          .insert({
            product_item_id: itemId,
            product_id: item.product_id,
            from_location_id: originalLocation,
            to_location_id: newLocation,
            notes: transferNotes || `Unit moved via edit - ${updateData.status === 'maintenance' ? 'moved to maintenance' : 'location update'}`
          });

        if (transferError) {
          console.error('Failed to create transfer record:', transferError);
          // Don't throw error here to avoid blocking the update
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ["product-item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["item-attributes", itemId] });
      toast.success("Item updated successfully");
      onClose();
    },
    onError: (error) => {
      console.error('Update error details:', error);
      toast.error(`Failed to update item: ${error.message}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if location changed
    const originalLocation = item?.current_storage_location_id;
    const newLocation = formData.current_storage_location_id;
    const locationChanged = originalLocation !== newLocation;
    
    console.log('EditItemModal handleSubmit:', {
      originalLocation,
      newLocation,
      locationChanged,
      currentStatus: item?.status,
      newStatus: formData.status,
      formData
    });
    
    // Skip location confirmation dialog when setting status to maintenance or when no actual location change required
    if (locationChanged && formData.status !== "maintenance" && formData.current_storage_location_id) {
      // Fetch location names for the confirmation dialog
      try {
        const locations = [];
        if (originalLocation) {
          const { data: fromLocation } = await supabase
            .from('storage_locations')
            .select('name')
            .eq('id', originalLocation)
            .single();
          if (fromLocation) locations.push({ id: originalLocation, name: fromLocation.name });
        }
        if (newLocation) {
          const { data: toLocation } = await supabase
            .from('storage_locations')
            .select('name')
            .eq('id', newLocation)
            .single();
          if (toLocation) locations.push({ id: newLocation, name: toLocation.name });
        }
        
        const fromLocationName = locations.find(l => l.id === originalLocation)?.name;
        const toLocationName = locations.find(l => l.id === newLocation)?.name;
        
        setLocationNames({ from: fromLocationName, to: toLocationName });
        setPendingFormData(formData);
        setShowLocationConfirm(true);
      } catch (error) {
        console.error('Failed to fetch location names:', error);
        // Proceed without names
        setLocationNames({});
        setPendingFormData(formData);
        setShowLocationConfirm(true);
      }
    } else {
      // No location change or maintenance status, proceed directly
      // For maintenance status, storage location is optional
      const recordTransfer = locationChanged && formData.status === "maintenance" && !!formData.current_storage_location_id;
      updateMutation.mutate({ updateData: formData, recordTransfer });
    }
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

  const handleLocationTransferConfirm = (recordTransfer: boolean, notes?: string) => {
    if (pendingFormData) {
      updateMutation.mutate({ 
        updateData: pendingFormData, 
        recordTransfer, 
        transferNotes: notes 
      });
      setPendingFormData(null);
    }
    setShowLocationConfirm(false);
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
    <Dialog open={!showLocationConfirm} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Item: {item.item_code}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">On Job</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Permanently Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">
                Condition 
                {formData.status === "maintenance" && (
                  <Badge variant="secondary" className="ml-2 text-xs">Auto-set for maintenance</Badge>
                )}
              </Label>
              <Select 
                value={formData.condition} 
                onValueChange={(value) => handleInputChange("condition", value)}
                disabled={formData.status === "maintenance"}
              >
                <SelectTrigger className={formData.status === "maintenance" ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : ""}>
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
              {formData.status === "maintenance" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Condition automatically set to "Needs Repair" for maintenance items
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_location">
              Storage Location 
              {formData.status === "maintenance" && (
                <Badge variant="outline" className="ml-2 text-xs">Optional for maintenance</Badge>
              )}
            </Label>
            <StorageLocationSelector
              value={formData.current_storage_location_id}
              onValueChange={(value) => handleInputChange("current_storage_location_id", value)}
              placeholder={formData.status === "maintenance" ? "Optional for maintenance items" : "Select storage location"}
              disabled={false}
            />
            {formData.status === "maintenance" && (
              <p className="text-xs text-muted-foreground">Storage location is locked during maintenance. Update from the maintenance tracker to change location.</p>
            )}
          </div>


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
              {updateMutation.isPending ? "Updating Unit..." : "Update Unit"}
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

      {/* Location Transfer Confirmation Dialog */}
      <LocationTransferConfirmDialog
        isOpen={showLocationConfirm}
        onClose={() => setShowLocationConfirm(false)}
        onConfirm={handleLocationTransferConfirm}
        fromLocationName={locationNames.from}
        toLocationName={locationNames.to}
        itemCode={item?.item_code || ""}
      />
    </Dialog>
  );
};
