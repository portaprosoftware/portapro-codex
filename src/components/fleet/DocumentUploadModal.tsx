import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus, X, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";
import { StockVehicleSelectionModal } from "./StockVehicleSelectionModal";
import { DialogDescription } from "@/components/ui/dialog";
import { DocumentCategorySelector } from "./DocumentCategorySelector";

// Sanitize filename for Supabase Storage
function sanitizeStorageKey(filename: string): string {
  // Remove or replace special characters that Supabase Storage doesn't like
  return filename
    .replace(/[^\w\s.-]/g, '') // Remove special chars except word chars, spaces, dots, hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase();
}

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

interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required: boolean;
}

interface Category {
  id?: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  requires_expiration?: boolean;
  custom_fields_schema?: any; // JSON from Supabase
  reminder_days_before?: number;
}

interface DocumentUploadModalProps {
  vehicles: Vehicle[];
  categories: Category[];
  trigger?: React.ReactNode;
}

export function DocumentUploadModal({ vehicles, categories, trigger }: DocumentUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);
  const customFieldsSchema: CustomField[] = selectedCategoryData?.custom_fields_schema 
    ? (Array.isArray(selectedCategoryData.custom_fields_schema) 
        ? selectedCategoryData.custom_fields_schema 
        : JSON.parse(selectedCategoryData.custom_fields_schema as string))
    : [];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVehicle || !selectedCategory || files.length === 0) {
        throw new Error("Please fill in all required fields");
      }

      const results = [];
      
      // Upload documents for the selected vehicle
      for (const file of files) {
        // Sanitize filename and organize by vehicle
        const sanitizedName = sanitizeStorageKey(file.name);
        const timestamp = Date.now();
        const filePath = `${selectedVehicle.id}/${timestamp}-${sanitizedName}`;
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('vehicle-documents')
          .upload(filePath, file);

        if (storageError) {
          throw new Error(`Storage upload failed: ${storageError.message}`);
        }

        // Create document record
        const { data, error } = await supabase
          .from('vehicle_documents')
          .insert({
            vehicle_id: selectedVehicle.id,
            document_type: selectedCategory,
            document_name: documentTitle || file.name,
            category: selectedCategory,
            file_name: file.name,
            file_path: storageData.path,
            file_size: file.size,
            document_number: documentNumber || null,
            notes: notes || null,
            expiry_date: expirationDate || null,
            custom_field_values: Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
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
      queryClient.invalidateQueries({ queryKey: ["expiring-documents"] });
      setOpen(false);
      setFiles([]);
      setSelectedVehicle(null);
      setSelectedCategory("");
      setDocumentTitle("");
      setDocumentNumber("");
      setNotes("");
      setExpirationDate("");
      setCustomFieldValues({});
      setAiSuggestion(null);
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      const errorMessage = error?.message || "Failed to upload documents. Please try again.";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      
      // Get AI suggestion for the first file
      if (newFiles.length > 0 && !selectedCategory) {
        await getSuggestion(newFiles[0].name);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getSuggestion = async (filename: string) => {
    setIsLoadingSuggestion(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-document-category', {
        body: { filename, availableCategories: categories }
      });

      if (error) throw error;
      
      setAiSuggestion(data);
      if (data.confidence > 0.7) {
        setSelectedCategory(data.category);
        toast({
          title: "Category Suggested",
          description: `AI suggested: ${data.category} (${Math.round(data.confidence * 100)}% confidence)`,
        });
      }
    } catch (error: any) {
      console.error('Error getting AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
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
          <DialogDescription>
            Upload and organize vehicle documents by category and associate them with specific vehicles.
          </DialogDescription>
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
              className="mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-transparent file:text-blue-600 hover:file:text-blue-700 file:cursor-pointer hover:file:underline"
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

          {/* Category Selection with AI Suggestion */}
          <div>
            <Label htmlFor="category">Document Category *</Label>
            {aiSuggestion && aiSuggestion.confidence > 0.5 && (
              <div className="mt-1 text-xs text-muted-foreground">
                AI suggests: <span className="font-semibold">{aiSuggestion.category}</span> 
                ({Math.round(aiSuggestion.confidence * 100)}% confidence)
              </div>
            )}
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
                <span className="text-muted-foreground">
                  {isLoadingSuggestion ? "Getting AI suggestion..." : "Select a category"}
                </span>
              )}
            </Button>
          </div>

          {/* Document Title */}
          <div>
            <Label htmlFor="document-title">Document Title</Label>
            <Input
              id="document-title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g., Annual Registration, Insurance Certificate"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Add a custom title (defaults to filename if left blank)
            </p>
          </div>

          {/* Expiration Date (if required by category) */}
          {selectedCategoryData?.requires_expiration && (
            <div>
              <Label htmlFor="expiration-date">Expiration Date *</Label>
              <Input
                id="expiration-date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="mt-2"
                required
              />
            </div>
          )}

          {/* Custom Fields (if defined for category) */}
          {customFieldsSchema.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Additional Information</div>
              {customFieldsSchema.map((field: CustomField) => (
                <div key={field.name}>
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && '*'}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    value={customFieldValues[field.name] || ''}
                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                    className="mt-2"
                    required={field.required}
                  />
                </div>
              ))}
            </div>
          )}

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

      {/* Vehicle Selection Modal */}
      <StockVehicleSelectionModal
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedDate={new Date()}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={setSelectedVehicle}
      />

      {/* Category Selection Modal */}
      <DocumentCategorySelector
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />
    </Dialog>
  );
}