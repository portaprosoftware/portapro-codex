import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { VehicleSelector } from "./VehicleSelector";

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  vehicle_id: string;
  document_type_id: string;
  document_name: string;
  expiration_date: Date | null;
  notes: string;
  file: File | null;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<FormData>({
    vehicle_id: "",
    document_type_id: "",
    document_name: "",
    expiration_date: null,
    notes: "",
    file: null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentTypes } = useQuery({
    queryKey: ["compliance-document-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_document_types")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let filePath = null;
      let fileName = null;
      let fileSize = null;

      // Upload file if provided
      if (data.file) {
        const fileExt = data.file.name.split('.').pop();
        const uploadFileName = `${data.vehicle_id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('compliance-documents')
          .upload(uploadFileName, data.file);

        if (uploadError) throw uploadError;
        
        filePath = uploadFileName;
        fileName = data.file.name;
        fileSize = data.file.size;
      }

      // Create document record
      const { error: insertError } = await supabase
        .from("vehicle_compliance_documents")
        .insert([{
          vehicle_id: data.vehicle_id,
          document_type_id: data.document_type_id,
          expiration_date: data.expiration_date?.toISOString().split('T')[0] || null,
          notes: data.notes || null,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize
        }]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-compliance"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-notification-counts"] });
      onClose();
      resetForm();
      toast({
        title: "Success",
        description: "Document added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add document.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      document_type_id: "",
      document_name: "",
      expiration_date: null,
      notes: "",
      file: null
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.document_type_id) {
      toast({
        title: "Error",
        description: "Please select a vehicle and document type.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Compliance Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <VehicleSelector
            selectedVehicleId={formData.vehicle_id}
            onVehicleSelect={(vehicleId) => setFormData({ ...formData, vehicle_id: vehicleId })}
          />

          <div>
            <Label htmlFor="document_type">Document Type *</Label>
            <Select value={formData.document_type_id} onValueChange={(value) => setFormData({ ...formData, document_type_id: value })}>
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

          <div>
            <Label htmlFor="document_name">Document Name</Label>
            <Input
              id="document_name"
              value={formData.document_name}
              onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
              placeholder="e.g., Policy ABC123"
            />
          </div>

          <div>
            <Label>Expiration Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expiration_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expiration_date ? format(formData.expiration_date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expiration_date || undefined}
                  onSelect={(date) => setFormData({ ...formData, expiration_date: date || null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="file">Upload Document</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {formData.file && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-32">{formData.file.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, JPG, PNG, DOC, DOCX (max 10MB)
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this document"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={uploadMutation.isPending} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
              {uploadMutation.isPending ? "Adding..." : "Add Document"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};