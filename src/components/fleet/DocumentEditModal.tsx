import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { StockVehicleSelectionModal } from "./StockVehicleSelectionModal";
import { DocumentCategorySelector } from "./DocumentCategorySelector";

interface Vehicle {
  id: string;
  license_plate: string | null;
  vehicle_type?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  status?: string | null;
  vehicle_image?: string | null;
  nickname?: string | null;
}

interface Category {
  id?: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  requires_expiration?: boolean;
  custom_fields_schema?: any;
  reminder_days_before?: number;
}

interface DocumentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    vehicle_id: string;
    category: string;
    document_name: string;
    document_number?: string;
    notes?: string;
  };
  vehicles: Vehicle[];
  categories: Category[];
}

export function DocumentEditModal({ isOpen, onClose, document, vehicles, categories }: DocumentEditModalProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(document.category);
  const [documentName, setDocumentName] = useState(document.document_name);
  const [documentNumber, setDocumentNumber] = useState(document.document_number || "");
  const [notes, setNotes] = useState(document.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize vehicle when document changes
  useEffect(() => {
    const vehicle = vehicles.find(v => v.id === document.vehicle_id);
    setSelectedVehicle(vehicle || null);
    setSelectedCategory(document.category);
    setDocumentName(document.document_name);
    setDocumentNumber(document.document_number || "");
    setNotes(document.notes || "");
  }, [document, vehicles]);

  const handleSave = async () => {
    if (!selectedVehicle || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please select a vehicle and category.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("vehicle_documents")
        .update({
          vehicle_id: selectedVehicle.id,
          category: selectedCategory,
          document_type: selectedCategory,
          document_name: documentName,
          document_number: documentNumber || null,
          notes: notes || null,
        })
        .eq("id", document.id);

      if (error) throw error;

      toast({
        title: "Document Updated",
        description: "Document details have been successfully updated.",
      });

      queryClient.invalidateQueries({ queryKey: ["vehicle-documents"] });
      onClose();
    } catch (error: any) {
      console.error("Error updating document:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Selection */}
          <div>
            <Label htmlFor="vehicle">Vehicle *</Label>
            <Button
              variant="outline"
              onClick={() => setIsVehicleModalOpen(true)}
              className="w-full mt-2 justify-start"
            >
              <Truck className="h-4 w-4 mr-2" />
              {!selectedVehicle
                ? "Select vehicle" 
                : selectedVehicle.license_plate || `Vehicle ${selectedVehicle.id.slice(0, 8)}`
              }
            </Button>
          </div>

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Document Category *</Label>
            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(true)}
              className="w-full mt-2 justify-start"
            >
              {selectedCategory ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categories.find(c => c.name === selectedCategory)?.color }}
                  />
                  <span>{selectedCategory}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select a category</span>
              )}
            </Button>
          </div>

          {/* Document Title */}
          <div>
            <Label htmlFor="edit-document-name">Document Title</Label>
            <Input
              id="edit-document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Document title"
              className="mt-2"
            />
          </div>

          {/* Document Number */}
          <div>
            <Label htmlFor="edit-document-number">Document Number</Label>
            <Input
              id="edit-document-number"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g., Main-2232, Policy #12345"
              className="mt-2"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about these documents..."
              className="mt-2 min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Vehicle Selection Modal */}
      <StockVehicleSelectionModal
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedDate={new Date()}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={(vehicle) => {
          setSelectedVehicle(vehicle);
          setIsVehicleModalOpen(false);
        }}
      />

      {/* Category Selection Modal */}
      <DocumentCategorySelector
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={(category) => {
          setSelectedCategory(category);
          setIsCategoryModalOpen(false);
        }}
      />
    </Dialog>
  );
}
