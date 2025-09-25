import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
};

type Vehicle = { id: string; license_plate: string };

export const SpillKitCheckForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [hasKit, setHasKit] = useState<boolean>(true);
  const [contentsChoices, setContentsChoices] = useState<string[]>([]);
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    // Load vehicles for selection
    supabase
      .from("vehicles")
      .select("id, license_plate")
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []));
    // Load default contents from company_settings
    supabase
      .from("company_settings")
      .select("default_spill_kit_contents")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const choices = (data?.default_spill_kit_contents as string[] | undefined) ?? [];
        setContentsChoices(choices);
      });
  }, []);

  const canSave = useMemo(() => vehicleId.length > 0, [vehicleId]);

  const handleToggleContent = (item: string) => {
    setSelectedContents((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from("vehicle_spill_kit_checks").insert({
        vehicle_id: vehicleId,
        checked_by_clerk: "dispatch", // placeholder
        has_kit: hasKit,
        contents: selectedContents,
        notes,
      });
      
      if (error) {
        console.error("Failed to save spill kit check", error);
        toast({
          title: "Error",
          description: "Failed to record spill kit check",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Spill kit check recorded successfully",
      });

      onSaved?.();
    } catch (error) {
      console.error("Error saving spill kit check:", error);
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

      <div className="flex items-center justify-between">
        <Label>Spill kit present</Label>
        <Switch checked={hasKit} onCheckedChange={setHasKit} />
      </div>

      <div>
        <Label className="mb-2 block">Contents present</Label>
        {contentsChoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No default contents configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contentsChoices.map((item) => (
              <label key={item} className="flex items-center gap-2 border rounded-md px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedContents.includes(item)}
                  onChange={() => handleToggleContent(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave}>Save</Button>
      </div>
    </div>
  );
};