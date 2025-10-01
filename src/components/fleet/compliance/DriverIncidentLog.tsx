import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Camera, Loader2, AlertTriangle, X, Upload, WifiOff } from "lucide-react";
import { VehicleSelectedDisplay } from "../VehicleSelectedDisplay";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Badge } from "@/components/ui/badge";

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
};

type Vehicle = { id: string; license_plate: string; make?: string; model?: string; year?: number };
type SpillType = { id: string; name: string; category: string; subcategory?: string };

export const DriverIncidentLog: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useUserRole();
  const { isOnline, addToQueue, queueCount } = useOfflineSync();
  
  // Basic incident data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [spillTypes, setSpillTypes] = useState<SpillType[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [spillTypeId, setSpillTypeId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [cause, setCause] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  
  // Photos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  // Spill kit integration
  const [spillKitStatus, setSpillKitStatus] = useState<{hasKit: boolean; lastCheckDate?: string} | null>(null);
  
  // GPS location
  const { latitude, longitude, error: gpsError, isLoading: gpsLoading } = useGeolocation();

  // Auto-fill location with GPS
  useEffect(() => {
    if (latitude && longitude && !location) {
      setLocation(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  }, [latitude, longitude]);

  // Load vehicles and spill types
  useEffect(() => {
    Promise.all([
      supabase.from("vehicles").select("id, license_plate, make, model, year"),
      supabase.from("configurable_spill_types").select("*").eq("is_active", true)
    ]).then(([vehiclesRes, spillTypesRes]) => {
      if (!vehiclesRes.error) {
        setVehicles(vehiclesRes.data || []);
      }
      if (!spillTypesRes.error) {
        setSpillTypes(spillTypesRes.data || []);
      }
    });
  }, []);

  // Check spill kit status when vehicle is selected
  useEffect(() => {
    if (!vehicleId) {
      setSpillKitStatus(null);
      return;
    }

    const checkSpillKit = async () => {
      const { data, error } = await supabase
        .from('vehicle_spill_kit_checks')
        .select('has_kit, created_at')
        .eq('vehicle_id', vehicleId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSpillKitStatus({
          hasKit: data.has_kit,
          lastCheckDate: data.created_at
        });
      } else {
        setSpillKitStatus(null);
      }
    };

    checkSpillKit();
  }, [vehicleId]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle.id);
    setIsVehicleModalOpen(false);
  };

  // Compress image to max 1MB
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        // Compress image
        const compressedFile = await compressImage(file);
        setPhotoFiles((prev) => [...prev, compressedFile]);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(compressedFile);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = useMemo(() => {
    return (
      vehicleId.trim().length > 0 &&
      spillTypeId.trim().length > 0 &&
      location.trim().length > 0 &&
      cause.trim().length > 0
    );
  }, [vehicleId, spillTypeId, location, cause]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const incidentData = {
        vehicle_id: vehicleId,
        spill_type: spillTypes.find(st => st.id === spillTypeId)?.name || "",
        location_description: location,
        cause_description: cause,
        immediate_action_taken: action || null,
        incident_date: new Date().toISOString(),
        severity: 'minor' as const,
        status: 'pending_review',
        responsible_party: 'unknown',
        driver_id: userId || 'unknown',
        witnesses_present: false,
        regulatory_notification_required: false,
        regulatory_notification_sent: false,
        authorities_notified: false,
        cleanup_actions: [],
      };

      // If offline, queue the data
      if (!isOnline) {
        // Convert photos to base64 for offline storage
        const photosData = await Promise.all(
          photoFiles.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            return { name: file.name, data: base64 };
          })
        );

        addToQueue({
          type: 'job_creation',
          jobId: crypto.randomUUID(),
          data: {
            ...incidentData,
            photos: photosData,
          },
        });

        return { id: 'offline-queued' };
      }

      // Online: normal flow
      const { data: incident, error: incidentError } = await supabase
        .from("spill_incident_reports")
        .insert([incidentData])
        .select()
        .single();

      if (incidentError) throw incidentError;

      // Upload photos
      if (photoFiles.length > 0) {
        for (const file of photoFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${incident.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('incident-photos')
            .upload(fileName, file);

          if (uploadError) {
            console.error("Error uploading photo:", uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('incident-photos')
            .getPublicUrl(fileName);

          await supabase
            .from("incident_photos")
            .insert({
              incident_id: incident.id,
              photo_url: publicUrl,
              photo_type: "incident_photo",
            });
        }
      }

      return incident;
    },
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: ["driver-incidents"] });
      
      if (incident.id === 'offline-queued') {
        toast({
          title: "Queued for Sync",
          description: "No internet. Incident will sync when connection is restored.",
        });
      } else {
        toast({
          title: "Incident Logged",
          description: "Your incident has been logged. Management will review soon.",
        });
      }
      
      onSaved?.();
    },
    onError: (error: any) => {
      console.error("Error saving incident:", error);
      toast({
        title: "Error",
        description: "Failed to log incident. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
      {/* Offline Status Banner */}
      {!isOnline && (
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Offline Mode</p>
                <p className="text-xs text-yellow-700 mt-1">
                  You're offline. Incidents will be saved locally and synced when connection is restored.
                  {queueCount > 0 && ` (${queueCount} pending)`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile-First Alert */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900">Quick Incident Log</p>
              <p className="text-xs text-orange-700 mt-1">
                Fill out basic info now. Management will add compliance details later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Vehicle *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Select vehicle..." />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id} className="text-base py-3">
                  {vehicle.license_plate}
                  {vehicle.make && ` (${vehicle.make} ${vehicle.model})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Spill Kit Status Integration */}
          {spillKitStatus && (
            <Card className={spillKitStatus.hasKit ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  {spillKitStatus.hasKit ? (
                    <Badge className="bg-green-600 text-white">Spill Kit: Present</Badge>
                  ) : (
                    <Badge className="bg-red-600 text-white">Spill Kit: Missing</Badge>
                  )}
                  {spillKitStatus.lastCheckDate && (
                    <span className="text-xs text-muted-foreground">
                      Last check: {new Date(spillKitStatus.lastCheckDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Spill Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spill Type *</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={spillTypeId} onValueChange={setSpillTypeId}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Select spill type..." />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {spillTypes.map((type) => (
                <SelectItem key={type.id} value={type.id} className="text-base py-3">
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did this happen?"
            className="min-h-24 text-base"
          />
          {gpsLoading && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Getting GPS location...
            </p>
          )}
          {gpsError && (
            <p className="text-xs text-destructive">{gpsError}</p>
          )}
          {latitude && longitude && (
            <p className="text-xs text-muted-foreground">
              GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cause */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Caused It? *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            placeholder="Brief description of what happened"
            className="min-h-24 text-base"
          />
        </CardContent>
      </Card>

      {/* Immediate Action */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Immediate Action (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="What did you do right away?"
            className="min-h-20 text-base"
          />
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos {photoFiles.length > 0 && `(${photoFiles.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-14 text-lg"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="mr-2 h-5 w-5" />
              Camera
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 text-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload
            </Button>
          </div>
          
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img 
                    src={preview} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Hidden file inputs */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-14 text-lg"
            onClick={onCancel}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-14 text-lg bg-gradient-to-r from-blue-500 to-blue-600"
            onClick={handleSubmit}
            disabled={!canSubmit || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Incident"
            )}
          </Button>
        </div>
      </div>

    </div>
  );
};
