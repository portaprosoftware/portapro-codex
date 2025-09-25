import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  Edit,
  Fuel,
  Wrench,
  Calendar,
  MapPin,
  FileText,
  Upload,
  X,
  AlertTriangle,
  Camera,
  Trash2,
  Plus
} from "lucide-react";
import { AddMaintenanceRecordModal } from "./AddMaintenanceRecordModal";
import { AddFuelLogModal } from "./fuel/AddFuelLogModal";
import { AddWorkOrderDrawer } from "./work-orders/AddWorkOrderDrawer";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  status: string;
  current_mileage?: number;
  created_at: string;
  notes?: string;
  vehicle_image?: string;
}

interface VehicleDetailDrawerProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleDetailDrawer: React.FC<VehicleDetailDrawerProps> = ({ vehicle, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentVehicleImage, setCurrentVehicleImage] = useState(vehicle.vehicle_image);
  const [damageImage, setDamageImage] = useState<File | null>(null);
  const [damageImagePreview, setDamageImagePreview] = useState<string | null>(null);
  const [damageDescription, setDamageDescription] = useState("");
  const [damageSeverity, setDamageSeverity] = useState("minor");
  const [isUploadingDamage, setIsUploadingDamage] = useState(false);
  
  // Modal states for add functionality
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [addFuelLogOpen, setAddFuelLogOpen] = useState(false);
  const [addWorkOrderOpen, setAddWorkOrderOpen] = useState(false);
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Mutation and handler logic for updating vehicle, uploading images, deleting images, and damage logs

  const { data: damageLogs = [] } = useQuery({
    queryKey: ["vehicle-damage-logs", vehicle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_damage_logs")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    license_plate: vehicle.license_plate,
    vehicle_type: vehicle.vehicle_type,
    make: vehicle.make || "",
    model: vehicle.model || "",
    year: vehicle.year || new Date().getFullYear(),
    vin: vehicle.vin || "",
    status: vehicle.status,
    current_mileage: vehicle.current_mileage || 0,
    notes: vehicle.notes || ""
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("vehicles")
        .update(data)
        .eq("id", vehicle.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsEditing(false);
      toast.success("Vehicle updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update vehicle");
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingImage(true);
      
      // Upload image to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${vehicle.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update vehicle record with image path
      const { data: vehicleData, error: updateError } = await supabase
        .from("vehicles")
        .update({ vehicle_image: uploadData.path })
        .eq("id", vehicle.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return { uploadData, vehicleData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setCurrentVehicleImage(data.uploadData.path);
      setVehicleImage(null);
      setImagePreview(null);
      setIsUploadingImage(false);
      toast.success("Vehicle photo uploaded successfully!");
    },
    onError: (error: any) => {
      setIsUploadingImage(false);
      toast.error(error.message || "Failed to upload photo");
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async () => {
      if (!currentVehicleImage) return;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vehicle-images')
        .remove([currentVehicleImage]);
      
      if (storageError) throw storageError;
      
      // Update vehicle record
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ vehicle_image: null })
        .eq("id", vehicle.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setCurrentVehicleImage(null);
      toast.success("Vehicle photo deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete photo");
    }
  });

  const uploadDamageMutation = useMutation({
    mutationFn: async () => {
      if (!damageDescription.trim()) {
        throw new Error("Damage description is required");
      }
      
      let imagePath = null;
      
      if (damageImage) {
        setIsUploadingDamage(true);
        
        // Upload damage image to storage
        const fileExt = damageImage.name.split('.').pop();
        const fileName = `${vehicle.id}-damage-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vehicle-damage-images')
          .upload(fileName, damageImage);
        
        if (uploadError) throw uploadError;
        imagePath = uploadData.path;
      }
      
      // Create damage log entry
      const { data, error } = await supabase
        .from("vehicle_damage_logs")
        .insert({
          vehicle_id: vehicle.id,
          description: damageDescription.trim(),
          severity: damageSeverity,
          image_path: imagePath,
          damage_type: "general"
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-damage-logs", vehicle.id] });
      setDamageDescription("");
      setDamageImage(null);
      setDamageImagePreview(null);
      setDamageSeverity("minor");
      setIsUploadingDamage(false);
      toast.success("Damage log added successfully!");
    },
    onError: (error: any) => {
      setIsUploadingDamage(false);
      toast.error(error.message || "Failed to add damage log");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicleMutation.mutate(formData);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setVehicleImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setVehicleImage(null);
    setImagePreview(null);
  };

  const handleUploadPhoto = () => {
    if (vehicleImage) {
      uploadImageMutation.mutate(vehicleImage);
    }
  };

  const getVehicleImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const handleDamageImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setDamageImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDamageImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDamageImage = () => {
    setDamageImage(null);
    setDamageImagePreview(null);
  };

  const getDamageImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('vehicle-damage-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "maintenance":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "retired":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "major":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full",
        "h-[85vh] overflow-hidden flex flex-col"
      )}>
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b bg-white rounded-t-2xl">
          {/* Pull indicator */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{vehicle.license_plate}</h1>
                <p className="text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("badge-gradient", getStatusColor(vehicle.status))}>
                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Desktop Tabs */}
              <TabsList className="hidden sm:grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="fuel">Fuel</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="damage">Damage Log</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              {/* Mobile Dropdown */}
              <div className="block sm:hidden mb-4">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="Select a tab" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="assignments">Assignments</SelectItem>
                    <SelectItem value="damage">Damage Log</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="overview" className="space-y-4">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="license_plate">License Plate</Label>
                        <Input
                          id="license_plate"
                          value={formData.license_plate}
                          onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_type">Vehicle Type</Label>
                        <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="trailer">Trailer</SelectItem>
                            <SelectItem value="pickup">Pickup Truck</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="make">Make</Label>
                        <Input
                          id="make"
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vin">VIN</Label>
                        <Input
                          id="vin"
                          value={formData.vin}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="current_mileage">Current Mileage</Label>
                        <Input
                          id="current_mileage"
                          type="number"
                          value={formData.current_mileage}
                          onChange={(e) => setFormData({ ...formData, current_mileage: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={updateVehicleMutation.isPending}>
                        {updateVehicleMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="w-5 h-5" />
                          Vehicle Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">License Plate:</span>
                          <span className="font-medium">{vehicle.license_plate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{vehicle.vehicle_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Make:</span>
                          <span className="font-medium">{vehicle.make || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-medium">{vehicle.model || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Year:</span>
                          <span className="font-medium">{vehicle.year || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VIN:</span>
                          <span className="font-medium">{vehicle.vin || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={cn(getStatusColor(vehicle.status))}>
                            {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Mileage:</span>
                          <span className="font-medium">{vehicle.current_mileage?.toLocaleString() || "N/A"} miles</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vehicle Photo Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Vehicle Photo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {currentVehicleImage ? (
                          <div className="space-y-3">
                            <img 
                              src={getVehicleImageUrl(currentVehicleImage)} 
                              alt={`${vehicle.license_plate} vehicle`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deleteImageMutation.mutate()}
                              disabled={deleteImageMutation.isPending}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Photo
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No photo available</p>
                          </div>
                        )}

                        {/* Upload new photo */}
                        <div className="mt-4 space-y-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="vehicle-image-upload"
                          />
                          <label
                            htmlFor="vehicle-image-upload"
                            className="cursor-pointer block w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors"
                          >
                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm text-gray-600">Click to upload new photo</span>
                          </label>

                          {imagePreview && (
                            <div className="space-y-3">
                              <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={handleUploadPhoto}
                                  disabled={isUploadingImage}
                                  className="flex-1"
                                >
                                  {isUploadingImage ? "Uploading..." : "Upload Photo"}
                                </Button>
                                <Button variant="outline" size="sm" onClick={removeImage}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Notes section */}
                {!isEditing && vehicle.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{vehicle.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Maintenance Tab Content */}
              <TabsContent value="maintenance" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Maintenance Records</h2>
                  <Button size="sm" onClick={() => setAddMaintenanceOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </div>
                {/* List maintenance records here */}
                {/* Placeholder for maintenance records */}
                <p className="text-gray-600">Maintenance records will be displayed here.</p>
              </TabsContent>

              {/* Fuel Tab Content */}
              <TabsContent value="fuel" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Fuel Logs</h2>
                  <Button size="sm" onClick={() => setAddFuelLogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Fuel Log
                  </Button>
                </div>
                {/* List fuel logs here */}
                {/* Placeholder for fuel logs */}
                <p className="text-gray-600">Fuel logs will be displayed here.</p>
              </TabsContent>

              {/* Assignments Tab Content */}
              <TabsContent value="assignments" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Assignments</h2>
                  <Button size="sm" onClick={() => setAddWorkOrderOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Work Order
                  </Button>
                </div>
                {/* List assignments/work orders here */}
                {/* Placeholder for assignments */}
                <p className="text-gray-600">Assignments will be displayed here.</p>
              </TabsContent>

              {/* Damage Log Tab Content */}
              <TabsContent value="damage" className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Add Damage Log</h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      uploadDamageMutation.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="damageDescription">Description</Label>
                      <Textarea
                        id="damageDescription"
                        value={damageDescription}
                        onChange={(e) => setDamageDescription(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="damageSeverity">Severity</Label>
                      <Select value={damageSeverity} onValueChange={setDamageSeverity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="damageImageUpload">Upload Image (optional)</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDamageImageChange}
                        className="hidden"
                        id="damageImageUpload"
                      />
                      <label
                        htmlFor="damageImageUpload"
                        className="cursor-pointer block p-2 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors"
                      >
                        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload damage image</span>
                      </label>
                      {damageImagePreview && (
                        <div className="space-y-3 mt-2">
                          <img src={damageImagePreview} alt="Damage Preview" className="w-full h-32 object-cover rounded-lg" />
                          <Button variant="outline" size="sm" onClick={removeDamageImage}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={uploadDamageMutation.isPending}>
                      {uploadDamageMutation.isPending ? "Adding..." : "Add Damage Log"}
                    </Button>
                  </form>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Damage Logs</h2>
                  {damageLogs.length === 0 ? (
                    <p className="text-gray-600">No damage logs available.</p>
                  ) : (
                    <ul className="space-y-4 max-h-64 overflow-y-auto">
                      {damageLogs.map((log: any) => (
                        <li key={log.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">{format(new Date(log.created_at), "PPP")}</span>
                          </div>
                          <p className="mb-2">{log.description}</p>
                          {log.image_path && (
                            <img
                              src={getDamageImageUrl(log.image_path)}
                              alt="Damage"
                              className="w-full h-40 object-cover rounded-lg"
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              {/* Documents Tab Content */}
              <TabsContent value="documents" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Documents</h2>
                  <Button size="sm" onClick={() => setAddDocumentOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
                {/* List documents here */}
                {/* Placeholder for documents */}
                <p className="text-gray-600">Documents will be displayed here.</p>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>

      {/* Keep all existing modals */}
      <AddMaintenanceRecordModal 
        open={addMaintenanceOpen}
        onOpenChange={setAddMaintenanceOpen}
        preselectedVehicleId={vehicle.id}
      />

      <AddFuelLogModal 
        open={addFuelLogOpen}
        onOpenChange={setAddFuelLogOpen}
        preselectedVehicleId={vehicle.id}
      />

      <AddWorkOrderDrawer 
        open={addWorkOrderOpen}
        onOpenChange={setAddWorkOrderOpen}
        onSuccess={() => {
          // Optional callback
        }}
      />

      {/* Simplified for now - can be added later */}
    </>
  );
};
