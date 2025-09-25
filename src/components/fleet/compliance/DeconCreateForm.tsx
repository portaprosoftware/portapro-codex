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

type Incident = { id: string; created_at: string; spill_type: string; location_description: string };

export const DeconCreateForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentId, setIncidentId] = useState<string>("");
  const [vehicleArea, setVehicleArea] = useState<string>("");
  const [ppeUsed, setPpeUsed] = useState<string>("");
  const [deconMethod, setDeconMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

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
    return incidentId.trim().length > 0;
  }, [incidentId]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("decon_logs")
        .insert({
          incident_id: incidentId,
          vehicle_area: vehicleArea || null,
          ppe_used: ppeUsed || null,
          decon_method: deconMethod || null,
          notes: notes || null,
          performed_by_clerk: "dispatch", // placeholder
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
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Related Incident</Label>
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
        <Label className="mb-2 block">Vehicle Area</Label>
        <select
          value={vehicleArea}
          onChange={(e) => setVehicleArea(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white"
        >
          <option value="">Select area...</option>
          <option value="exterior">Exterior</option>
          <option value="interior">Interior</option>
          <option value="engine_bay">Engine Bay</option>
          <option value="tank_area">Tank Area</option>
          <option value="pump_system">Pump System</option>
          <option value="undercarriage">Undercarriage</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <Label className="mb-2 block">PPE Used</Label>
        <Textarea
          value={ppeUsed}
          onChange={(e) => setPpeUsed(e.target.value)}
          placeholder="List personal protective equipment used"
        />
      </div>

      <div>
        <Label className="mb-2 block">Decontamination Method</Label>
        <select
          value={deconMethod}
          onChange={(e) => setDeconMethod(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white"
        >
          <option value="">Select method...</option>
          <option value="pressure_wash">Pressure Wash</option>
          <option value="chemical_treatment">Chemical Treatment</option>
          <option value="steam_cleaning">Steam Cleaning</option>
          <option value="disinfectant_wipe">Disinfectant Wipe</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <Label className="mb-2 block">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about the decontamination process"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave}>Save</Button>
      </div>
    </div>
  );
};