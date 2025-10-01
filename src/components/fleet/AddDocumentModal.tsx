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
import { DocumentTypeSelector } from "./DocumentTypeSelector";
import { Truck, Search, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleContextId?: string | null;
  vehicleContextName?: string | null;
}

interface FormData {
  vehicle_id: string;
  document_type_id: string;
  document_type_name: string;
  document_name: string;
  expiration_date: Date | null;
  notes: string;
  file: File | null;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  vehicleContextId = null,
  vehicleContextName = null
}) => {
  const isVehicleContextLocked = !!vehicleContextId;
  
  const [formData, setFormData] = useState<FormData>({
    vehicle_id: vehicleContextId || "",
    document_type_id: "",
    document_type_name: "",
    document_name: "",
    expiration_date: null,
    notes: "",
    file: null
  });
  const [isDocumentTypeSelectorOpen, setIsDocumentTypeSelectorOpen] = useState(false);
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Remove the document types query since we're using DocumentTypeSelector component

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
          file_size: fileSize,
          source_context: isVehicleContextLocked ? 'vehicle_profile' : null,
        }]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-compliance"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-documents", vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-metrics", vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-activity", vehicleContextId] });
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
      document_type_name: "",
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
          <div>
            <Label htmlFor="vehicle">Vehicle *</Label>
            <div className="space-y-2">
              {isVehicleContextLocked ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                  <Truck className="w-4 h-4" />
                  <span className="font-medium">{vehicleContextName || 'Selected Vehicle'}</span>
                  <Badge variant="secondary" className="ml-auto">Locked</Badge>
                </div>
              ) : formData.vehicle_id ? (
                <VehicleSelectedDisplay 
                  vehicleId={formData.vehicle_id}
                  onChangeClick={() => setIsVehicleSelectorOpen(true)}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsVehicleSelectorOpen(true)}
                >
                  Select vehicle
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="document_type">Document Type *</Label>
            <div className="space-y-2">
              {formData.document_type_name ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                  <span className="font-medium">{formData.document_type_name}</span>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDocumentTypeSelectorOpen(true)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsDocumentTypeSelectorOpen(true)}
                >
                  Select document type
                </Button>
              )}
            </div>
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

        {/* Document Type Selector Modal */}
        <DocumentTypeSelector
          open={isDocumentTypeSelectorOpen}
          onOpenChange={setIsDocumentTypeSelectorOpen}
          onDocumentTypeSelect={(typeId, typeName) => {
            setFormData({ ...formData, document_type_id: typeId, document_type_name: typeName });
          }}
          selectedTypeId={formData.document_type_id}
        />

        {/* Vehicle Selector Modal */}
        <Dialog open={isVehicleSelectorOpen} onOpenChange={setIsVehicleSelectorOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Select Vehicle</DialogTitle>
            </DialogHeader>
            <VehicleModalContent
              selectedVehicleId={formData.vehicle_id}
              onVehicleSelect={(vehicleId) => {
                setFormData({ ...formData, vehicle_id: vehicleId });
                setIsVehicleSelectorOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

// Component to display selected vehicle
const VehicleSelectedDisplay: React.FC<{
  vehicleId: string;
  onChangeClick: () => void;
}> = ({ vehicleId, onChangeClick }) => {
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, vehicle_type, year, status")
        .eq("status", "active");
      
      if (error) throw error;
      return data;
    },
  });

  const selectedVehicle = vehicles?.find(v => v.id === vehicleId);

  if (!selectedVehicle) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
        <span className="text-gray-500">Loading vehicle...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <span className="font-medium">
          {selectedVehicle.license_plate} - {selectedVehicle.make} {selectedVehicle.model}
        </span>
      </div>
      <Button 
        type="button"
        variant="outline" 
        size="sm"
        onClick={onChangeClick}
      >
        Change
      </Button>
    </div>
  );
};

// Vehicle Modal Content Component
const VehicleModalContent: React.FC<{
  selectedVehicleId: string;
  onVehicleSelect: (vehicleId: string) => void;
}> = ({ selectedVehicleId, onVehicleSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, vehicle_type, year, status")
        .eq("status", "active")
        .order("license_plate");
      
      if (error) throw error;
      return data;
    },
  });

  const filteredVehicles = vehicles?.filter(vehicle => {
    const searchLower = searchQuery.toLowerCase();
    return (
      vehicle.license_plate.toLowerCase().includes(searchLower) ||
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.vehicle_type.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getVehicleTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'truck':
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case 'van':
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case 'pickup':
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case 'trailer':
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const formatVehicleType = (type: string) => {
    return type.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by license plate, make, model, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicle List */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <Card 
              key={vehicle.id} 
              className={cn(
                "p-4 cursor-pointer hover:shadow-md transition-shadow",
                selectedVehicleId === vehicle.id && "border-blue-500 bg-blue-50"
              )}
              onClick={() => onVehicleSelect(vehicle.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {vehicle.license_plate}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{vehicle.make} {vehicle.model}</span>
                    {vehicle.year && (
                      <span>• {vehicle.year}</span>
                    )}
                  </div>
                  <Badge className={cn("mt-1", getVehicleTypeColor(vehicle.vehicle_type))}>
                    {formatVehicleType(vehicle.vehicle_type)}
                  </Badge>
                </div>
                {selectedVehicleId === vehicle.id && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
