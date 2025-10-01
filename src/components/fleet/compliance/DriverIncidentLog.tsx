import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Camera, Loader2, AlertTriangle, X, Upload } from "lucide-react";
import { VehicleSelectedDisplay } from "../VehicleSelectedDisplay";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";

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

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle.id);
    setIsVehicleModalOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        setPhotoFiles((prev) => [...prev, file]);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
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
        // Auto-filled backend values (hidden from driver)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-incidents"] });
      toast({
        title: "Incident Logged",
        description: "Your incident has been logged. Management will review soon.",
      });
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
        <CardContent>
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
