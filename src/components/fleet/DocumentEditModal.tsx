import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface DocumentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    document_name: string;
    document_number?: string;
    notes?: string;
  };
}

export function DocumentEditModal({ isOpen, onClose, document }: DocumentEditModalProps) {
  const [documentName, setDocumentName] = useState(document.document_name);
  const [documentNumber, setDocumentNumber] = useState(document.document_number || "");
  const [notes, setNotes] = useState(document.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setDocumentName(document.document_name);
    setDocumentNumber(document.document_number || "");
    setNotes(document.notes || "");
  }, [document]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("vehicle_documents")
        .update({
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
          {/* Document Name */}
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
              placeholder="Optional document number"
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
              placeholder="Add any additional notes"
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
    </Dialog>
  );
}
