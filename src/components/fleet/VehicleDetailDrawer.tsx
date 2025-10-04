import React, { useState, Suspense, lazy, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { VehicleSpillKitManager } from "./VehicleSpillKitManager";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VehicleTypeSelector } from "./VehicleTypeSelector";
import { getVehicleTypeDisplayName } from "@/lib/vehicleTypeUtils";
import { TabSkeleton } from "./vehicle-tabs/TabSkeleton";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useNavigate } from 'react-router-dom';

// Lazy load tab components for better performance
const VehicleOverviewTab = lazy(() => import('./vehicle-tabs/VehicleOverviewTab').then(m => ({ default: m.VehicleOverviewTab })));
const VehicleMaintenanceTab = lazy(() => import('./vehicle-tabs/VehicleMaintenanceTab').then(m => ({ default: m.VehicleMaintenanceTab })));
const VehicleFuelTab = lazy(() => import('./vehicle-tabs/VehicleFuelTab').then(m => ({ default: m.VehicleFuelTab })));
const VehicleAssignmentsTab = lazy(() => import('./vehicle-tabs/VehicleAssignmentsTab').then(m => ({ default: m.VehicleAssignmentsTab })));
const VehicleSpillKitTab = lazy(() => import('./vehicle-tabs/VehicleSpillKitTab').then(m => ({ default: m.VehicleSpillKitTab })));
const VehicleDocumentsTab = lazy(() => import('./vehicle-tabs/VehicleDocumentsTab').then(m => ({ default: m.VehicleDocumentsTab })));

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeletePhotoDialog, setShowDeletePhotoDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  
  // Track vehicle profile view
  useEffect(() => {
    if (isOpen) {
      trackEvent('vehicle_profile_viewed', {
        vehicleId: vehicle.id,
        vehicleName: vehicle.license_plate,
      });
    }
  }, [isOpen, vehicle.id, vehicle.license_plate, trackEvent]);
  
  // Track tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackEvent('vehicle_tab_changed', {
      vehicleId: vehicle.id,
      vehicleName: vehicle.license_plate,
      tab,
    });
  };
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
  const [showVehicleTypeSelector, setShowVehicleTypeSelector] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(vehicle.vehicle_type || "");
  const [selectedVehicleTypeName, setSelectedVehicleTypeName] = useState<string>("");
  
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

  const handleVehicleTypeSelect = (typeId: string, typeName: string) => {
    setSelectedVehicleType(typeId);
    setSelectedVehicleTypeName(typeName);
    setFormData({ ...formData, vehicle_type: typeId });
  };

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
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicle.id] });
      setIsEditing(false);
      toast.success("Vehicle updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update vehicle");
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicle.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      setIsEditing(false);
      setShowDeleteDialog(false);
      onClose();
      navigate('/fleet');
    },
    onError: (error: any) => {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    },
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
        "h-[100vh] overflow-hidden flex flex-col"
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{vehicle.license_plate}</h1>
                <Badge className={cn("badge-gradient", getStatusColor(vehicle.status))}>
                  {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="default"
              onClick={onClose}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Close Vehicle Profile
            </Button>
          </div>
          <div className="mt-2 ml-16">
            <p className="text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
              {/* Desktop Tabs */}
              <TabsList className="hidden sm:grid w-full grid-cols-7 h-auto">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="maintenance" className="text-xs sm:text-sm">Maintenance</TabsTrigger>
                <TabsTrigger value="fuel" className="text-xs sm:text-sm">Fuel</TabsTrigger>
                <TabsTrigger value="assignments" className="text-xs sm:text-sm">Assignments</TabsTrigger>
                <TabsTrigger value="spillkit" className="text-xs sm:text-sm">Spill Kit</TabsTrigger>
                <TabsTrigger value="damage" className="text-xs sm:text-sm">Damage Log</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
              </TabsList>

              {/* Mobile Dropdown */}
              <div className="block sm:hidden mb-4">
                <Select value={activeTab} onValueChange={handleTabChange}>
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="Select a tab" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="assignments">Assignments</SelectItem>
                    <SelectItem value="spillkit">Spill Kit</SelectItem>
                    <SelectItem value="damage">Damage Log</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* New Tab Components with Lazy Loading */}
              <TabsContent value="overview" className="space-y-4">
                <Suspense fallback={<TabSkeleton />}>
                  <VehicleOverviewTab 
                    vehicleId={vehicle.id} 
                    licensePlate={vehicle.license_plate} 
                    vehicleData={vehicle} 
                    isActive={activeTab === 'overview'}
                    onEditClick={() => setIsEditing(true)}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <Suspense fallback={<TabSkeleton />}>
                  <VehicleMaintenanceTab 
                    vehicleId={vehicle.id} 
                    licensePlate={vehicle.license_plate} 
                    isActive={activeTab === 'maintenance'}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="fuel" className="space-y-4">
                <Suspense fallback={<TabSkeleton />}>
                  <VehicleFuelTab 
                    vehicleId={vehicle.id} 
                    licensePlate={vehicle.license_plate} 
                    isActive={activeTab === 'fuel'}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <Suspense fallback={<TabSkeleton />}>
                  <VehicleAssignmentsTab 
                    vehicleId={vehicle.id} 
                    licensePlate={vehicle.license_plate}
                    isActive={activeTab === 'assignments'}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="spillkit" className="space-y-4">
                <Suspense fallback={<TabSkeleton />}>
                  <VehicleSpillKitTab 
                    vehicleId={vehicle.id} 
                    licensePlate={vehicle.license_plate}
                    isActive={activeTab === 'spillkit'}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Suspense fallback={<TabSkeleton />}>
                  <VehicleDocumentsTab 
                    vehicleId={vehicle.id} 
                    licensePlate={vehicle.license_plate}
                    isActive={activeTab === 'documents'}
                  />
                </Suspense>
              </TabsContent>

              {/* Damage Log Tab */}
              <TabsContent value="damage" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Compliance Documents
                    </CardTitle>
                    <Button
                      onClick={() => setAddDocumentOpen(true)}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">No documents found</p>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>

      {/* Child Modals */}
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
          queryClient.invalidateQueries({ queryKey: ["work-orders"] });
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        }}
        preselectedAssetId={vehicle.id}
      />

      {/* Simple document upload placeholder */}
      {addDocumentOpen && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
            <p className="text-gray-600 mb-4">Document upload functionality will be available here.</p>
            <Button onClick={() => setAddDocumentOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle: {vehicle.license_plate}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_plate">License Plate *</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
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

              <div className="space-y-2 col-span-2">
                <Label>Vehicle Type</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVehicleTypeSelector(true)}
                  className="w-full justify-start"
                >
                  {formData.vehicle_type ? getVehicleTypeDisplayName(formData.vehicle_type) : "Select vehicle type"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="current_mileage">Current Mileage</Label>
                <Input
                  id="current_mileage"
                  type="number"
                  value={formData.current_mileage}
                  onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">General Information</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add general vehicle notes..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Advanced notes available via toggle above</p>
              </div>

            </div>

            <div className="flex flex-col gap-4 pt-4 border-t">
              <div className="flex justify-between items-center w-full gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Vehicle
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateVehicleMutation.isPending}>
                    {updateVehicleMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteVehicleMutation.mutate()}
        title="Delete Vehicle"
        description={`Are you sure you want to permanently delete ${vehicle?.license_plate || 'this vehicle'}? This action cannot be undone.`}
        itemName={vehicle?.license_plate || 'vehicle'}
        isLoading={deleteVehicleMutation.isPending}
      />

      {/* Vehicle Type Selector Modal */}
      <VehicleTypeSelector
        open={showVehicleTypeSelector}
        onOpenChange={setShowVehicleTypeSelector}
        onTypeSelect={handleVehicleTypeSelect}
        selectedTypeId={selectedVehicleType}
      />
    </>
  );
};
