
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type Vehicle = { id: string; license_plate: string };

export const IncidentCreateModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [action, setAction] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from("vehicles")
      .select("id, license_plate")
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setVehicleId("");
      setLocation("");
      setAction("");
    }
  }, [isOpen]);

  const canSave = useMemo(() => location.trim().length > 0, [location]);

  const handleSave = async () => {
    const { error } = await supabase.from("spill_incident_reports").insert({
      incident_date: new Date().toISOString(),
      vehicle_id: vehicleId || null,
      location_description: location,
      immediate_action_taken: action || null,
    });
    if (error) {
      console.error("Failed to save incident", error);
      return;
    }
    onSaved?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
      <Card className="w-full max-w-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Log Spill Incident</h3>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Vehicle (optional)</Label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="">No vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-2 block">Location</Label>
            <Textarea value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Describe where it happened" />
          </div>

          <div>
            <Label className="mb-2 block">Immediate Action (optional)</Label>
            <Textarea value={action} onChange={(e) => setAction(e.target.value)} placeholder="What was done right away?" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>Save</Button>
        </div>
      </Card>
    </div>
  );
};
