import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockVehicleSelectionModal } from "../StockVehicleSelectionModal";
import { VehicleSelectedDisplay } from "../VehicleSelectedDisplay";
import { VehicleAreaSelectionModal } from "./VehicleAreaSelectionModal";
import { PPESelectionModal } from "./PPESelectionModal";
import { DeconMethodSelectionModal } from "./DeconMethodSelectionModal";
import { WeatherSelectionModal } from "./WeatherSelectionModal";
import { PhotoCapture } from "./PhotoCapture";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Truck, MapPin, Cloud, Shield, Sparkles, CheckCircle, Camera, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatBadgeText } from "@/lib/textUtils";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleBadge } from "./RoleBadge";

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
};

type Incident = { id: string; created_at: string; spill_type: string; location_description: string };

export const DeconCreateForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { toast } = useToast();
  const { user, role, userId } = useUserRole();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentId, setIncidentId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  
  // Vehicle Areas (multi-select)
  const [vehicleAreas, setVehicleAreas] = useState<string[]>([]);
  const [isAreasModalOpen, setIsAreasModalOpen] = useState(false);
  
  // Location Type
  const [locationType, setLocationType] = useState<string>("");
  
  // Weather
  const [weatherConditions, setWeatherConditions] = useState<string>("");
  const [weatherDetails, setWeatherDetails] = useState<string>("");
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isAutoWeatherLoading, setIsAutoWeatherLoading] = useState(false);
  
  // PPE (multi-select)
  const [ppeItems, setPpeItems] = useState<string[]>([]);
  const [ppeCompliance, setPpeCompliance] = useState<boolean>(true);
  const [isPPEModalOpen, setIsPPEModalOpen] = useState(false);
  
  // Decon Methods (multi-select)
  const [deconMethods, setDeconMethods] = useState<string[]>([]);
  const [isMethodsModalOpen, setIsMethodsModalOpen] = useState(false);
  
  // Verification
  const [postInspectionStatus, setPostInspectionStatus] = useState<string>("");
  const [inspectorSignature, setInspectorSignature] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  
  // Notes
  const [notes, setNotes] = useState<string>("");
  
  // Inspector info
  const inspectorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown';
  const inspectorRole = role || 'unknown';

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle.id);
    setIsVehicleModalOpen(false);
  };

  useEffect(() => {
    // Load recent incidents for linking
    supabase
      .from("spill_incident_reports")
      .select("id, created_at, spill_type, location_description")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load incidents", error);
          return;
        }
        setIncidents((data as Incident[]) ?? []);
      });
  }, []);

  const canSave = useMemo(() => {
    const hasRequiredFields = incidentId.trim().length > 0 && vehicleId.trim().length > 0 && vehicleAreas.length > 0;
    const hasSignature = inspectorSignature.trim().length > 0;
    const hasRequiredPhotos = postInspectionStatus !== 'fail' || photos.length > 0;
    return hasRequiredFields && hasSignature && hasRequiredPhotos;
  }, [incidentId, vehicleId, vehicleAreas, inspectorSignature, postInspectionStatus, photos]);
  
  const handleAutoAddWeather = async () => {
    setIsAutoWeatherLoading(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const { data, error } = await supabase.functions.invoke("get-current-weather", {
              body: { latitude, longitude },
            });

            if (error) throw error;

            if (data) {
              const locationStr = data.city && data.state ? ` - ${data.city}, ${data.state}` : '';
              const formattedDescription = formatBadgeText(data.description);
              setWeatherDetails(`${formattedDescription} • ${data.temp}°F • ${data.humidity}% Humidity • Wind ${data.windSpeed} MPH${locationStr}`);
              setWeatherConditions(data.description || "");
              toast({ title: "Weather Added", description: "Current weather conditions have been recorded" });
            }
            setIsAutoWeatherLoading(false);
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast({ title: "Location Error", description: "Could not get your location", variant: "destructive" });
            setIsAutoWeatherLoading(false);
          }
        );
      } else {
        toast({ title: "Not Supported", description: "Geolocation is not supported", variant: "destructive" });
        setIsAutoWeatherLoading(false);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      toast({ title: "Error", description: "Failed to fetch weather data", variant: "destructive" });
      setIsAutoWeatherLoading(false);
    }
  };
  
  const handleManualWeatherSelect = (conditions: string[]) => {
    setWeatherConditions(conditions.join(", "));
  };

  const handleSave = async () => {
    try {
      const verificationTimestamp = new Date().toISOString();
      
      const { error } = await supabase
        .from("decon_logs")
        .insert({
          incident_id: incidentId,
          vehicle_id: vehicleId,
          vehicle_areas: vehicleAreas,
          location_type: locationType || null,
          weather_conditions: weatherConditions || null,
          weather_details: weatherDetails || null,
          ppe_items: ppeItems,
          ppe_compliance_status: ppeCompliance,
          decon_methods: deconMethods,
          post_inspection_status: postInspectionStatus || null,
          inspector_signature: inspectorSignature || null,
          inspector_clerk_id: userId || null,
          inspector_role: inspectorRole,
          verification_timestamp: verificationTimestamp,
          follow_up_required: followUpRequired,
          photos: photos,
          notes: notes || null,
          performed_by_clerk: userId || "dispatch",
        });

      if (error) {
        console.error("Failed to save decon log", error);
        toast({
          title: "Error",
          description: "Failed to record decontamination log",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Decontamination log recorded successfully",
      });

      onSaved?.();
    } catch (error) {
      console.error("Error saving decon log:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Incident & Vehicle Context */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Incident & Vehicle Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Related Incident *</Label>
            <select
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="">Select incident...</option>
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.spill_type} - {inc.location_description} ({new Date(inc.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-2 block">Vehicle *</Label>
            {selectedVehicle ? (
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
            <Label className="mb-2 block">Vehicle Areas *</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsAreasModalOpen(true)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {vehicleAreas.length === 0 ? "Select areas cleaned" : `${vehicleAreas.length} area${vehicleAreas.length > 1 ? 's' : ''} selected`}
            </Button>
            {vehicleAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {vehicleAreas.map((area, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {area.startsWith("other:") ? area.substring(6) : area.replace(/_/g, " ")}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setVehicleAreas(prev => prev.filter((_, i) => i !== idx))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Location Type</Label>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facility">Company Facility</SelectItem>
                <SelectItem value="field">Field Location</SelectItem>
                <SelectItem value="customer_site">Customer Site</SelectItem>
                <SelectItem value="disposal_site">Disposal Site</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Conditions */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Environmental Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Weather at Time of Decon</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoAddWeather}
                disabled={isAutoWeatherLoading}
                className="flex-1"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {isAutoWeatherLoading ? "Fetching..." : "Auto-Add Weather"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWeatherModalOpen(true)}
                className="flex-1"
              >
                <Cloud className="mr-2 h-4 w-4" />
                Select weather manually
              </Button>
            </div>
            {weatherDetails && (
              <p className="text-xs text-muted-foreground mt-2">{weatherDetails}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PPE & Compliance */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">PPE & Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">PPE Used</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsPPEModalOpen(true)}
            >
              <Shield className="mr-2 h-4 w-4" />
              {ppeItems.length === 0 ? "Select PPE items" : `${ppeItems.length} item${ppeItems.length > 1 ? 's' : ''} selected`}
            </Button>
            {ppeItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {ppeItems.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {item.startsWith("other:") ? item.substring(6) : item.replace(/_/g, " ")}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setPpeItems(prev => prev.filter((_, i) => i !== idx))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="ppe-compliance" className="font-semibold">PPE Compliance Confirmed</Label>
              <p className="text-sm text-muted-foreground">Driver confirms proper PPE was worn</p>
            </div>
            <Switch
              id="ppe-compliance"
              checked={ppeCompliance}
              onCheckedChange={setPpeCompliance}
            />
          </div>
        </CardContent>
      </Card>

      {/* Decontamination Methods */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Decontamination Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Methods Applied</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsMethodsModalOpen(true)}
            >
              {deconMethods.length === 0 ? "Select decon methods" : `${deconMethods.length} method${deconMethods.length > 1 ? 's' : ''} selected`}
            </Button>
            {deconMethods.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {deconMethods.map((method, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {method.replace(/_/g, " ")}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDeconMethods(prev => prev.filter((_, i) => i !== idx))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification & Effectiveness */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Verification & Effectiveness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inspector Info Display */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm font-medium mb-1">Inspector Information</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{inspectorName}</span>
              <span>•</span>
              <RoleBadge role={inspectorRole as any} />
              <span>•</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Post-Decon Inspection Status *</Label>
            <Select value={postInspectionStatus} onValueChange={setPostInspectionStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Pass - Meets All Standards
                  </div>
                </SelectItem>
                <SelectItem value="fail">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    Fail - Does Not Meet Standards
                  </div>
                </SelectItem>
                <SelectItem value="conditional">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    Conditional - Requires Follow-Up
                  </div>
                </SelectItem>
                <SelectItem value="not_applicable">
                  <div className="flex items-center gap-2">
                    Not Applicable
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Follow-Up Required Toggle */}
          {(postInspectionStatus === 'fail' || postInspectionStatus === 'conditional') && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/10">
              <div>
                <Label htmlFor="follow-up" className="font-semibold">Follow-Up Required</Label>
                <p className="text-sm text-muted-foreground">Corrective action needed</p>
              </div>
              <Switch
                id="follow-up"
                checked={followUpRequired}
                onCheckedChange={setFollowUpRequired}
              />
            </div>
          )}

          <div>
            <Label className="mb-2 block">Inspector Signature *</Label>
            <Input
              placeholder="Type your full name to sign"
              value={inspectorSignature}
              onChange={(e) => setInspectorSignature(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Photos ({photos.length}/10)</Label>
              {postInspectionStatus === 'fail' && photos.length === 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  At least 1 photo required for failures
                </Badge>
              )}
            </div>
            <PhotoCapture
              onPhotosChange={setPhotos}
              maxPhotos={10}
              initialPhotos={photos}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details about the decontamination process..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave}>Save Decon Log</Button>
      </div>

      {/* Modals */}
      <StockVehicleSelectionModal
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedDate={new Date()}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={handleVehicleSelect}
      />
      
      <VehicleAreaSelectionModal
        isOpen={isAreasModalOpen}
        onClose={() => setIsAreasModalOpen(false)}
        onSelect={setVehicleAreas}
        currentValue={vehicleAreas}
      />
      
      <WeatherSelectionModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        onSelect={handleManualWeatherSelect}
        currentValue={weatherConditions ? weatherConditions.split(", ") : []}
      />
      
      <PPESelectionModal
        isOpen={isPPEModalOpen}
        onClose={() => setIsPPEModalOpen(false)}
        onSelect={setPpeItems}
        currentValue={ppeItems}
      />
      
      <DeconMethodSelectionModal
        isOpen={isMethodsModalOpen}
        onClose={() => setIsMethodsModalOpen(false)}
        onSelect={setDeconMethods}
        currentValue={deconMethods}
      />
    </div>
  );
};