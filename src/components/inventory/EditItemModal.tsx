
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

interface EditItemModalProps {
  itemId: string;
  onClose: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ itemId, onClose }) => {
  const queryClient = useQueryClient();
  const [showOCRCapture, setShowOCRCapture] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    condition: "",
    location: "",
    color: "",
    size: "",
    material: "",
    notes: "",
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
        .select("*, tool_number, vendor_id, plastic_code, manufacturing_date, mold_cavity, ocr_confidence_score, verification_status, tracking_photo_url")
        .eq("id", itemId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        status: item.status || "",
        condition: item.condition || "",
        location: item.location || "",
        color: item.color || "",
        size: item.size || "",
        material: item.material || "",
        notes: item.notes || "",
        // OCR fields
        tool_number: item.tool_number || "",
        vendor_id: item.vendor_id || "",
        plastic_code: item.plastic_code || "",
        manufacturing_date: item.manufacturing_date || "",
        mold_cavity: item.mold_cavity || ""
      });
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: typeof formData) => {
      const { error } = await supabase
        .from("product_items")
        .update(updateData)
        .eq("id", itemId);
      
      if (error) throw error;
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

  const getVerificationBadge = (status: string | null, confidence: number | null) => {
    if (!status) return null;
    
    const badges = {
      manual_verified: <Badge className="bg-green-100 text-green-700"><Shield className="w-3 h-3 mr-1" />Verified</Badge>,
      auto_detected: confidence && confidence > 0.8 
        ? <Badge className="bg-blue-100 text-blue-700">Auto-detected</Badge>
        : <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>,
      needs_review: <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>
    };

    return badges[status as keyof typeof badges] || null;
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

          {/* QR Code Section */}
          <div className="space-y-3">
            <Label>QR Code</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <QrCode className="w-4 h-4 mr-2" />
              Edit System Generated QR Code
            </Button>
          </div>

          {/* Item Attributes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Item Attributes</h3>
              <Button
                type="button"
                variant="link"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                onClick={() => {
                  // TODO: Navigate to product attributes
                  console.log("Navigate to product attributes");
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                To add additional attributes to the list - click here
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => handleInputChange("color", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="tan">Tan</SelectItem>
                    <SelectItem value="gray">Gray</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select value={formData.size} onValueChange={(value) => handleInputChange("size", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="ada">ADA Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select value={formData.material} onValueChange={(value) => handleInputChange("material", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="fiberglass">Fiberglass</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* OCR Tool Tracking Section */}
          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Tool Tracking Information
                  {item?.verification_status && getVerificationBadge(item.verification_status, item.ocr_confidence_score)}
                </h3>
                <p className="text-sm text-green-700">Capture or update tool information using OCR</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOCRCapture(true)}
                className="border-green-600 text-green-600 hover:bg-green-50"
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
              disabled={updateMutation.isPending}
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
