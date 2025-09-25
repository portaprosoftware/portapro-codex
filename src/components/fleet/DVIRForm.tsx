import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VehicleSelector } from "@/components/fleet/VehicleSelector";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DVIRFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const DEFAULT_ITEMS = [
  "lights","tires","brakes","steering","mirrors","wipers","horn","seatbelts",
  "coupling","air_lines","battery","fluid_leaks","tank_hose_leaks","fire_extinguisher",
  "warning_triangles","spill_kit_present","ppe_available","registration_insurance_present"
];

export const DVIRForm: React.FC<DVIRFormProps> = ({ open, onOpenChange }) => {
  const qc = useQueryClient();
  const [assetType, setAssetType] = useState<"vehicle"|"trailer">("vehicle");
  const [assetId, setAssetId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [reportType, setReportType] = useState<"pre_trip"|"post_trip">("pre_trip");
  const [odometer, setOdometer] = useState<string>("");
  const [engineHours, setEngineHours] = useState<string>("");
  const [majorDefect, setMajorDefect] = useState(false);
  const [defectKey, setDefectKey] = useState("brakes");
  const [submitting, setSubmitting] = useState(false);
  const [verifyFix, setVerifyFix] = useState(false);

  const itemsJson = useMemo(() => {
    const base: Record<string, any> = {};
    DEFAULT_ITEMS.forEach(k => base[k] = { result: "pass", notes: "", photos: [] });
    if (majorDefect) {
      base[defectKey] = { result: "fail", notes: "", photos: [] };
    }
    return base;
  }, [majorDefect, defectKey]);

  const reset = () => {
    setAssetType("vehicle");
    setAssetId("");
    setDriverId("");
    setReportType("pre_trip");
    setOdometer("");
    setEngineHours("");
    setMajorDefect(false);
    setDefectKey("brakes");
    setVerifyFix(false);
  };

  const handleSubmit = async () => {
    if (!assetId || (!odometer && !engineHours)) return;
    try {
      setSubmitting(true);
      const { data: dvir, error } = await supabase
        .from("dvir_reports")
        .insert({
          asset_type: assetType,
          asset_id: assetId,
          driver_id: driverId || null,
          type: reportType,
          status: "submitted",
          odometer_miles: odometer ? Number(odometer) : null,
          engine_hours: engineHours ? Number(engineHours) : null,
          items: itemsJson,
          defects_count: majorDefect ? 1 : 0,
          major_defect_present: majorDefect,
          out_of_service_flag: majorDefect,
          submitted_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error) throw error;

      if (majorDefect && dvir) {
        // create defect row
        const { error: defErr } = await supabase.from("dvir_defects").insert({
          dvir_id: dvir.id,
          asset_type: assetType,
          asset_id: assetId,
          item_key: defectKey,
          severity: "major",
          status: "open",
        });
        if (defErr) throw defErr;
      }

      if (verifyFix) {
        const { error: closeErr } = await supabase
          .from("dvir_defects")
          .update({ status: "closed", closed_at: new Date().toISOString() })
          .eq("asset_type", assetType)
          .eq("asset_id", assetId)
          .eq("status", "open");
        if (closeErr) throw closeErr;
      }

      await qc.invalidateQueries({ queryKey: ["dvir-reports"] });
      await qc.invalidateQueries({ queryKey: ["dvir-defects"] });
      toast.success("DVIR submitted" + (verifyFix ? " and prior defects verified" : ""));
      onOpenChange(false);
      reset();
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit DVIR");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New DVIR</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Asset Type</label>
              <select className="mt-1 w-full border rounded-md p-2" value={assetType} onChange={e=>setAssetType(e.target.value as any)}>
                <option value="vehicle">Vehicle</option>
                <option value="trailer">Trailer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle</label>
              {assetType === "vehicle" ? (
                <VehicleSelector
                  selectedVehicleId={assetId}
                  onVehicleSelect={(vehicleId) => setAssetId(vehicleId)}
                  className="mt-1"
                />
              ) : (
                <input className="mt-1 w-full border rounded-md p-2" placeholder="UUID" value={assetId} onChange={e=>setAssetId(e.target.value)} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select className="mt-1 w-full border rounded-md p-2" value={reportType} onChange={e=>setReportType(e.target.value as any)}>
                <option value="pre_trip">Pre-trip</option>
                <option value="post_trip">Post-trip</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver ID (optional)</label>
              <input className="mt-1 w-full border rounded-md p-2" placeholder="UUID" value={driverId} onChange={e=>setDriverId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Odometer (miles)</label>
              <input type="number" className="mt-1 w-full border rounded-md p-2" value={odometer} onChange={e=>setOdometer(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Engine Hours</label>
              <input type="number" className="mt-1 w-full border rounded-md p-2" value={engineHours} onChange={e=>setEngineHours(e.target.value)} />
            </div>
          </div>

          <div className="border rounded-md p-3">
            <div className="flex items-center gap-2">
              <input id="majorDefect" type="checkbox" checked={majorDefect} onChange={e=>setMajorDefect(e.target.checked)} />
              <label htmlFor="majorDefect" className="text-sm font-medium">Major defect present</label>
            </div>
            {majorDefect && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">Defect Item</label>
                <select className="mt-1 w-full border rounded-md p-2" value={defectKey} onChange={e=>setDefectKey(e.target.value)}>
                  {DEFAULT_ITEMS.map(k=> (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border rounded-md p-3">
            <div className="flex items-center gap-2">
              <input
                id="verifyFix"
                type="checkbox"
                checked={verifyFix}
                onChange={e=>setVerifyFix(e.target.checked)}
                disabled={majorDefect}
              />
              <label htmlFor="verifyFix" className="text-sm font-medium">
                Driver verifies prior defects for this asset are fixed
              </label>
            </div>
            {majorDefect && (
              <p className="text-sm text-gray-500 mt-2">
                Verification is disabled when reporting a major defect.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}