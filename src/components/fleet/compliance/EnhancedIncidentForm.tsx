import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PhotoCapture } from "./PhotoCapture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Camera, AlertTriangle, Truck } from "lucide-react";
import { VehicleFilterModal } from "../VehicleFilterModal";

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
};

type Vehicle = { id: string; license_plate: string };
type SpillType = { id: string; name: string; category: string; subcategory?: string };
type Witness = { name: string; contact_info: string };

export const EnhancedIncidentForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { toast } = useToast();
  
  // Basic incident data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [spillTypes, setSpillTypes] = useState<SpillType[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [spillTypeId, setSpillTypeId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [cause, setCause] = useState<string>("");
  const [action, setAction] = useState<string>("");
  
  // Enhanced fields
  const [severity, setSeverity] = useState<string>("minor");
  const [volumeEstimate, setVolumeEstimate] = useState<string>("");
  const [volumeUnit, setVolumeUnit] = useState<string>("gallons");
  const [weatherConditions, setWeatherConditions] = useState<string>("");
  const [responsibleParty, setResponsibleParty] = useState<string>("unknown");
  const [regulatoryNotificationRequired, setRegulatoryNotificationRequired] = useState<boolean>(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  
  // Cleanup actions
  const [cleanupActions, setCleanupActions] = useState<string[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  
  // New witness form
  const [newWitnessName, setNewWitnessName] = useState<string>("");
  const [newWitnessContact, setNewWitnessContact] = useState<string>("");

  useEffect(() => {
    // Load vehicles and spill types
    Promise.all([
      supabase.from("vehicles").select("id, license_plate"),
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

  const cleanupActionOptions = [
    "Absorbent material applied",
    "Area vacuumed/pumped",
    "Authorities notified",
    "Area cordoned off",
    "Soil sampling performed",
    "Water sampling performed",
    "Environmental contractor called",
    "Customer notified",
    "Spill kit deployed"
  ];

  const toggleCleanupAction = (action: string) => {
    setCleanupActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  const addWitness = () => {
    if (newWitnessName.trim()) {
      setWitnesses(prev => [...prev, { name: newWitnessName, contact_info: newWitnessContact }]);
      setNewWitnessName("");
      setNewWitnessContact("");
    }
  };

  const removeWitness = (index: number) => {
    setWitnesses(prev => prev.filter((_, i) => i !== index));
  };

  const canSave = useMemo(() => {
    return (
      vehicleId.trim().length > 0 &&
      spillTypeId.trim().length > 0 &&
      location.trim().length > 0 &&
      cause.trim().length > 0
    );
  }, [vehicleId, spillTypeId, location, cause]);

  const handleSave = async () => {
    try {
      const incidentData = {
        vehicle_id: vehicleId,
        spill_type: spillTypes.find(st => st.id === spillTypeId)?.name || "",
        location_description: location,
        cause_description: cause,
        immediate_action_taken: action || null,
        incident_date: new Date().toISOString(),
        severity: severity as any,
        volume_estimate: volumeEstimate ? parseFloat(volumeEstimate) : null,
        volume_unit: volumeUnit,
        weather_conditions: weatherConditions || null,
        responsible_party: responsibleParty,
        cleanup_actions: cleanupActions,
        witnesses_present: witnesses.length > 0,
        regulatory_notification_required: regulatoryNotificationRequired,
        regulatory_notification_sent: false,
        status: 'open',
        driver_id: "dispatch", // Will be updated with actual user later
        authorities_notified: cleanupActions.includes("Authorities notified"),
      };

      const { data: incident, error: incidentError } = await supabase
        .from("spill_incident_reports")
        .insert(incidentData)
        .select()
        .single();

      if (incidentError) throw incidentError;

      // Add witnesses
      if (witnesses.length > 0) {
        const witnessData = witnesses.map(w => ({
          incident_id: incident.id,
          name: w.name,
          contact_info: w.contact_info
        }));

        const { error: witnessError } = await supabase
          .from("incident_witnesses")
          .insert(witnessData);

        if (witnessError) throw witnessError;
      }

      // Upload and add photos
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

      toast({
        title: "Success",
        description: "Incident recorded successfully with all details",
      });

      onSaved?.();
    } catch (error) {
      console.error("Error saving incident:", error);
      toast({
        title: "Error",
        description: "Failed to record incident",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Basic Incident Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Vehicle *</Label>
              {vehicleId ? (
                <VehicleSelectedDisplay 
                  vehicleId={vehicleId}
                  onChangeClick={() => setIsVehicleModalOpen(true)}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsVehicleModalOpen(true)}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Select vehicle
                </Button>
              )}
            </div>

            <div>
              <Label>Spill Type *</Label>
              <Select value={spillTypeId} onValueChange={setSpillTypeId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select spill type..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  {spillTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Severity *</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="reportable">Reportable to EPA/State</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Responsible Party</Label>
              <Select value={responsibleParty} onValueChange={setResponsibleParty}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Location Description *</Label>
            <Textarea
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Describe where the incident occurred"
              className="min-h-20"
            />
          </div>

          <div>
            <Label>Cause Description *</Label>
            <Textarea
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              placeholder="Describe what caused the spill"
              className="min-h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Volume and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Volume & Environmental Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Volume Estimate</Label>
              <Input
                type="number"
                value={volumeEstimate}
                onChange={(e) => setVolumeEstimate(e.target.value)}
                placeholder="0"
                className="bg-white"
              />
            </div>

            <div>
              <Label>Volume Unit</Label>
              <Select value={volumeUnit} onValueChange={setVolumeUnit}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="gallons">Gallons</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                  <SelectItem value="cubic_feet">Cubic Feet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Weather Conditions</Label>
              <Select value={weatherConditions} onValueChange={setWeatherConditions}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select weather..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="dry">Dry</SelectItem>
                  <SelectItem value="rain">Rain</SelectItem>
                  <SelectItem value="snow">Snow</SelectItem>
                  <SelectItem value="windy">Windy</SelectItem>
                  <SelectItem value="fog">Fog</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="regulatory"
              checked={regulatoryNotificationRequired}
              onCheckedChange={(checked) => setRegulatoryNotificationRequired(checked === true)}
            />
            <Label htmlFor="regulatory">Regulatory notification required (EPA/State)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Cleanup Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Cleanup Actions Taken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {cleanupActionOptions.map((action) => (
              <div key={action} className="flex items-center space-x-2">
                <Checkbox
                  id={action}
                  checked={cleanupActions.includes(action)}
                  onCheckedChange={() => toggleCleanupAction(action)}
                />
                <Label htmlFor={action} className="text-sm">{action}</Label>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div>
            <Label>Additional Actions Taken</Label>
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Describe any other immediate actions taken"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Witnesses */}
      <Card>
        <CardHeader>
          <CardTitle>Witnesses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {witnesses.length > 0 && (
            <div className="space-y-2">
              {witnesses.map((witness, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{witness.name}</div>
                    <div className="text-sm text-gray-600">{witness.contact_info}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWitness(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Witness name"
              value={newWitnessName}
              onChange={(e) => setNewWitnessName(e.target.value)}
              className="bg-white"
            />
            <Input
              placeholder="Contact info"
              value={newWitnessContact}
              onChange={(e) => setNewWitnessContact(e.target.value)}
              className="bg-white"
            />
            <Button onClick={addWitness} disabled={!newWitnessName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setPhotoFiles(Array.from(e.target.files));
                }
              }}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {photoFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{photoFiles.length} file(s) selected:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(photoFiles).map((file, idx) => (
                    <Badge key={idx} variant="secondary">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <PhotoCapture
              onPhotosChange={setPhotos}
              maxPhotos={10}
              initialPhotos={photos}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white border-t p-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          Save Incident Report
        </Button>
      </div>

      <VehicleFilterModal
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedDate={new Date()}
        selectedVehicle={vehicleId}
        onVehicleSelect={(vehicle) => {
          setVehicleId(vehicle.id);
          setIsVehicleModalOpen(false);
        }}
      />
    </div>
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