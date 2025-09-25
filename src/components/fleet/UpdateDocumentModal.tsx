import React, { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, X, Calendar, Trash2 } from "lucide-react";

interface UpdateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  onDelete?: (documentId: string) => void;
}

interface ComplianceDocument {
  id: string;
  vehicle_id: string;
  document_type_id: string;
  expiration_date: string | null;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  vehicles: {
    license_plate: string;
    vehicle_type: string;
  };
  compliance_document_types: {
    name: string;
  };
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  default_reminder_days: number;
}

export const UpdateDocumentModal: React.FC<UpdateDocumentModalProps> = ({
  isOpen,
  onClose,
  documentId,
  onDelete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch the document details
  const { data: document, isLoading: documentLoading } = useQuery({
    queryKey: ["compliance-document", documentId],
    queryFn: async () => {
      if (!documentId) return null;
      
      const { data, error } = await supabase
        .from("vehicle_compliance_documents")
        .select(`
          *,
          vehicles(license_plate, vehicle_type),
          compliance_document_types(name)
        `)
        .eq("id", documentId)
        .single();
      
      if (error) throw error;
      return data as ComplianceDocument;
    },
    enabled: !!documentId && isOpen,
  });

  // Fetch document types for the dropdown
  const { data: documentTypes } = useQuery({
    queryKey: ["compliance-document-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_document_types")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as DocumentType[];
    },
    enabled: isOpen,
  });

  // Populate form when document data is loaded
  useEffect(() => {
    if (document) {
      setExpirationDate(document.expiration_date || "");
      setNotes(document.notes || "");
      setDocumentTypeId(document.document_type_id);
    }
  }, [document]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setExpirationDate("");
      setNotes("");
      setDocumentTypeId("");
      setUploading(false);
    }
  }, [isOpen]);

  const updateDocumentMutation = useMutation({
    mutationFn: async (updateData: {
      documentTypeId: string;
      expirationDate: string;
      notes: string;
      filePath?: string;
      fileName?: string;
      fileSize?: number;
    }) => {
      if (!documentId) throw new Error("Document ID is required");

      const updatePayload: any = {
        document_type_id: updateData.documentTypeId,
        expiration_date: updateData.expirationDate || null,
        notes: updateData.notes || null,
        updated_at: new Date().toISOString(),
      };

      // Add file information if a new file was uploaded
      if (updateData.filePath) {
        updatePayload.file_path = updateData.filePath;
        updatePayload.file_name = updateData.fileName;
        updatePayload.file_size = updateData.fileSize;
      }

      const { data, error } = await supabase
        .from("vehicle_compliance_documents")
        .update(updatePayload)
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-compliance"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-document", documentId] });
      toast.success("Document updated successfully");
      onClose();
    },
    onError: (error) => {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    },
  });

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${documentId}_${Date.now()}.${fileExt}`;
    const filePath = `compliance-documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    return {
      filePath,
      fileName: file.name,
      fileSize: file.size,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentTypeId) {
      toast.error("Please select a document type");
      return;
    }

    setUploading(true);

    try {
      let fileInfo: { filePath?: string; fileName?: string; fileSize?: number } = {};

      // Upload new file if selected
      if (selectedFile) {
        fileInfo = await uploadFile(selectedFile);
      }

      await updateDocumentMutation.mutateAsync({
        documentTypeId,
        expirationDate,
        notes,
        ...fileInfo,
      });
    } catch (error) {
      console.error("Error in update process:", error);
      toast.error("Failed to update document");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleDelete = () => {
    if (documentId && onDelete) {
      if (window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
        onDelete(documentId);
        onClose();
      }
    }
  };

  const getUrgencyLevel = (expirationDate: string | null) => {
    if (!expirationDate) return "unknown";
    
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "critical";
    if (diffDays <= 30) return "warning";
    return "good";
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      case "critical":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "warning":
        return "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold border-0";
      case "good":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const formatDaysRemaining = (expirationDate: string | null) => {
    if (!expirationDate) return "No expiration date";
    
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `${diffDays} days remaining`;
  };

  if (documentLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!document) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <p className="text-gray-600">Document not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const urgency = getUrgencyLevel(document.expiration_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Update Compliance Document
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Info Header */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium text-gray-900">
                  {document.vehicles.license_plate} - {document.compliance_document_types.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-transparent border-blue-500 text-blue-600 font-medium">
                    {document.vehicles.vehicle_type?.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ')}
                  </Badge>
                </div>
              </div>
              <Badge className={getUrgencyColor(urgency)}>
                {formatDaysRemaining(document.expiration_date)}
              </Badge>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">
                <Calendar className="w-4 h-4 inline mr-1" />
                Expiration Date
              </Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this document..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload new document (optional)
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">
                      PDF, DOC, DOCX, JPG, PNG up to 10MB
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {document.file_name && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current file:</p>
                    <p className="text-sm text-gray-600">{document.file_name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Document
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || !documentTypeId}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
              >
                {uploading ? "Updating..." : "Update Document"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};