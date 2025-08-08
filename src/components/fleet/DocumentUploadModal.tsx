import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

interface DocumentUploadModalProps {
  vehicles: Array<{ id: string; license_plate: string; make: string; model: string }>;
  categories: Array<{ name: string; icon: string; color: string; description: string }>;
  trigger?: React.ReactNode;
}

export function DocumentUploadModal({ vehicles, categories, trigger }: DocumentUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVehicle || !selectedCategory || files.length === 0) {
        throw new Error("Please fill in all required fields");
      }

      const results = [];
      
      for (const file of files) {
        // Upload file to storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('vehicle-documents')
          .upload(fileName, file);

        if (storageError) throw storageError;

        // Create document record
        const { data, error } = await supabase
          .from('vehicle_documents')
          .insert({
            vehicle_id: selectedVehicle,
            document_type: selectedCategory,
            document_name: file.name,
            category: selectedCategory,
            file_name: file.name,
            file_path: storageData.path,
            file_size: file.size,
            document_number: documentNumber || null,
            notes: notes || null,
            upload_date: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        results.push(data);
      }

      return results;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${files.length} document(s) uploaded successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["vehicle-documents"] });
      setOpen(false);
      setFiles([]);
      setSelectedVehicle("");
      setSelectedCategory("");
      setDocumentNumber("");
      setNotes("");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Vehicle Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <Label htmlFor="files">Select Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className="mt-2"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div>
            <Label htmlFor="vehicle">Vehicle *</Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Document Category *</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Number */}
          <div>
            <Label htmlFor="document-number">Document Number</Label>
            <Input
              id="document-number"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g., Main-2232, Policy #12345"
              className="mt-2"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about these documents..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !selectedVehicle || !selectedCategory || files.length === 0}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Documents"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}