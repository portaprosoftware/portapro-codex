import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
};

type Vehicle = { id: string; license_plate: string };

export const IncidentCreateForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [spillType, setSpillType] = useState<string>("");
  const [cause, setCause] = useState<string>("");

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("id, license_plate")
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load vehicles", error);
          return;
        }
        setVehicles((data as Vehicle[]) ?? []);
      });
  }, []);

  // Require key fields so the insert matches the table's required properties
  const canSave = useMemo(() => {
    return (
      vehicleId.trim().length > 0 &&
      location.trim().length > 0 &&
      spillType.trim().length > 0 &&
      cause.trim().length > 0
    );
  }, [vehicleId, location, spillType, cause]);

  const handleSave = async () => {
    try {
      // NOTE: spill_incident_reports requires cause_description, spill_type, driver_id, vehicle_id, etc.
      const payload = {
        created_at: new Date().toISOString(),
        vehicle_id: vehicleId,
        location_description: location,
        immediate_action_taken: action || null,
        cause_description: cause,
        spill_type: spillType,
        driver_id: "dispatch", // placeholder; can be wired to Clerk later
        authorities_notified: false,
      } as any; // Keep payload flexible if Supabase types evolve

      const { error } = await supabase
        .from("spill_incident_reports" as any)
        .insert(payload);

      if (error) {
        console.error("Failed to save incident", error);
        toast({
          title: "Error",
          description: "Failed to record spill incident",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Spill incident recorded successfully",
      });

      onSaved?.();
    } catch (error) {
      console.error("Error saving incident:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Vehicle</Label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white"
        >
          <option value="">Select vehicle...</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.license_plate}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label className="mb-2 block">Spill Type</Label>
        <select
          value={spillType}
          onChange={(e) => setSpillType(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white"
        >
          <option value="">Select spill type...</option>
          <option value="fuel">Fuel</option>
          <option value="septage">Septage</option>
          <option value="chemical">Chemical</option>
          <option value="water">Water</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <Label className="mb-2 block">Cause Description</Label>
        <Textarea
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="Describe what caused the spill"
        />
      </div>

      <div>
        <Label className="mb-2 block">Location</Label>
        <Textarea
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Describe where it happened"
        />
      </div>

      <div>
        <Label className="mb-2 block">Immediate Action (optional)</Label>
        <Textarea
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="What was done right away?"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave}>Save</Button>
      </div>
    </div>
  );
};