
import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Trash2
} from "lucide-react";
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

interface VehicleDetailModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, isOpen, onClose }) => {
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
  const queryClient = useQueryClient();

  // Query damage logs
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{vehicle.license_plate}</DialogTitle>
                <p className="text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("badge-gradient", getStatusColor(vehicle.status))}>
                {vehicle.status}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="fuel">Fuel</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="damage">Damage Log</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

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

                <div className="grid grid-cols-3 gap-4">
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
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    />
                  </div>
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
                </div>

                <div>
                  <Label htmlFor="current_mileage">Current Mileage</Label>
                  <Input
                    id="current_mileage"
                    type="number"
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateVehicleMutation.isPending}>
                    {updateVehicleMutation.isPending ? "Updating..." : "Update Vehicle"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Vehicle Image Section */}
                <Card>
                  <CardContent className="p-6">
                     <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                       {currentVehicleImage && !imagePreview ? (
                         <div className="relative w-full h-full">
                           <img
                             src={getVehicleImageUrl(currentVehicleImage)}
                             alt="Vehicle"
                             className="w-full h-full object-cover"
                           />
                           <Button
                             type="button"
                             variant="destructive"
                             size="sm"
                             className="absolute top-2 right-2"
                             onClick={() => deleteImageMutation.mutate()}
                             disabled={deleteImageMutation.isPending}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       ) : imagePreview ? (
                         <div className="relative w-full h-full">
                           <img
                             src={imagePreview}
                             alt="Vehicle preview"
                             className="w-full h-full object-cover"
                           />
                           <Button
                             type="button"
                             variant="destructive"
                             size="sm"
                             className="absolute top-2 right-2"
                             onClick={removeImage}
                           >
                             <X className="w-4 h-4" />
                           </Button>
                         </div>
                       ) : (
                         <div className="text-center">
                           <Truck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                           <p className="text-gray-500">Vehicle Photo</p>
                         </div>
                       )}
                     </div>
                    
                    {/* Photo Upload Section */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={handleImageChange}
                            className="hidden"
                            id="vehicle-image-input"
                          />
                          <label
                            htmlFor="vehicle-image-input"
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm font-medium w-full"
                          >
                            <Upload className="w-4 h-4" />
                            Choose Photo
                          </label>
                        </div>
                        {vehicleImage && (
                          <Button
                            onClick={handleUploadPhoto}
                            disabled={isUploadingImage}
                            className="bg-gradient-primary text-white"
                          >
                            {isUploadingImage ? "Uploading..." : "Upload"}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 50MB</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-500">Make/Model</p>
                        <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Year</p>
                        <p className="font-semibold">{vehicle.year}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">VIN</p>
                        <p className="font-semibold">{vehicle.vin || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Mileage</p>
                        <p className="font-semibold">{vehicle.current_mileage?.toLocaleString() || "Unknown"} miles</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Added</p>
                      <p className="font-semibold">{format(new Date(vehicle.created_at), "MMM dd, yyyy")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Wrench className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Last Service</p>
                      <p className="font-semibold">N/A</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">Unknown</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No maintenance records found</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="w-5 h-5" />
                  Fuel Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No fuel logs found</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Daily Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No assignments found</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="damage">
            <div className="space-y-4">
              {/* Add New Damage Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Report New Damage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="damage-description">Description</Label>
                    <Textarea
                      id="damage-description"
                      placeholder="Describe the damage or issue..."
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="damage-severity">Severity</Label>
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

                  {/* Damage Photo Section */}
                  <div className="space-y-2">
                    <Label>Photo (Optional)</Label>
                    {damageImagePreview && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img
                          src={damageImagePreview}
                          alt="Damage preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={removeDamageImage}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handleDamageImageChange}
                        className="hidden"
                        id="damage-image-input"
                      />
                      <label
                        htmlFor="damage-image-input"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm font-medium"
                      >
                        <Camera className="w-4 h-4" />
                        Add Photo
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={() => uploadDamageMutation.mutate()}
                    disabled={!damageDescription.trim() || isUploadingDamage}
                    className="w-full"
                  >
                    {isUploadingDamage ? "Adding..." : "Add Damage Log"}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Damage Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Damage History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {damageLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No damage logs found</p>
                  ) : (
                    <div className="space-y-4">
                      {damageLogs.map((log: any) => (
                        <div key={log.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{log.description}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(log.created_at), "MMM dd, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <Badge className={cn("text-xs", getSeverityColor(log.severity))}>
                              {log.severity}
                            </Badge>
                          </div>
                          
                          {log.image_path && (
                            <div className="w-32 h-32 border rounded-lg overflow-hidden">
                              <img
                                src={getDamageImageUrl(log.image_path)}
                                alt="Damage photo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Compliance Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No documents found</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
