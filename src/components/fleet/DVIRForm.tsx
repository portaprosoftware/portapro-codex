import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StockVehicleSelectionModal } from "@/components/fleet/StockVehicleSelectionModal";
import { DriverSelectionModal } from "@/components/fleet/DriverSelectionModal";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Truck, Calendar, User } from "lucide-react";

interface DVIRFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preSelectedVehicleId?: string;
  preSelectedDriverId?: string;
  preSelectedType?: "pre_trip" | "post_trip";
  useModal?: boolean;
}

const VEHICLE_ITEMS = [
  "air_compressor", "air_lines", "battery", "brake_accessories", "brakes", "clutch",
  "defroster", "drive_line", "engine", "fifth_wheel", "front_axle", "fuel_tanks",
  "heater", "horn", "lights_head_stop", "lights_tail_dash", "lights_turn_indicators",
  "mirrors", "muffler", "oil_pressure", "onboard_recorder", "radiator",
  "rear_end", "reflectors", "springs", "starter", "steering", "tires",
  "transmission", "wheels", "windows", "windshield_wipers"
];

const TRAILER_ITEMS = [
  "brake_connection", "brakes", "coupling_chains", "coupling_king_pin",
  "doors", "hitch", "landing_gear", "lights_all", "roof", "springs",
  "tarpaulin", "tires", "wheels"
];

const SANITATION_ITEMS = [
  "vacuum_pump", "waste_tank_integrity", "fresh_water_tank", "hoses",
  "spray_wand_pump_equipment", "pto_pump_engagement", "deodorizer_chemical_supply"
];

const SAFETY_ITEMS = [
  "fire_extinguisher", "flags_flares_fusees", "spare_bulbs_fuses", "spill_kit",
  "ppe", "sds_sheets", "gps_telematics", "radio_mobile_device"
];

const INSPECTION_CATEGORIES = {
  vehicle: { title: "Vehicle Inspection", items: VEHICLE_ITEMS },
  trailer: { title: "Trailer Inspection", items: TRAILER_ITEMS },
  sanitation: { title: "Sanitation Equipment", items: SANITATION_ITEMS },
  safety: { title: "Safety & Compliance", items: SAFETY_ITEMS }
};

export const DVIRForm: React.FC<DVIRFormProps> = ({ 
  open, 
  onOpenChange, 
  preSelectedVehicleId,
  preSelectedDriverId,
  preSelectedType,
  useModal = false
}) => {
  const qc = useQueryClient();
  const [assetType, setAssetType] = useState<"vehicle"|"trailer">("vehicle");
  const [assetId, setAssetId] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [reportType, setReportType] = useState<"pre_trip"|"post_trip">(preSelectedType || "pre_trip");
  const [odometer, setOdometer] = useState<string>("");
  const [engineHours, setEngineHours] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [verifyFix, setVerifyFix] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [conditionSatisfactory, setConditionSatisfactory] = useState(false);
  const [defectsCorrected, setDefectsCorrected] = useState(false);
  const [defectsNotRequiredForSafety, setDefectsNotRequiredForSafety] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vehicle: true,
    trailer: false,
    sanitation: true,
    safety: true
  });
  const [inspectionItems, setInspectionItems] = useState<Record<string, { 
    status: "pass" | "fail" | "na", 
    notes: string 
  }>>({});

  // Initialize with pre-selected values
  React.useEffect(() => {
    if (preSelectedVehicleId && !selectedVehicle) {
      // Fetch vehicle details if we have an ID but no vehicle object
      // For now, just set the ID
      setAssetId(preSelectedVehicleId);
    }
    if (preSelectedDriverId && !selectedDriver) {
      setDriverId(preSelectedDriverId);
    }
    if (preSelectedType) {
      setReportType(preSelectedType);
    }
  }, [preSelectedVehicleId, preSelectedDriverId, preSelectedType, selectedVehicle, selectedDriver]);

  // Initialize inspection items for all categories
  React.useEffect(() => {
    const allItems: Record<string, { status: "pass" | "fail" | "na", notes: string }> = {};
    
    // Always include vehicle and safety items
    [...VEHICLE_ITEMS, ...SAFETY_ITEMS, ...SANITATION_ITEMS].forEach(item => {
      if (!inspectionItems[item]) {
        allItems[item] = { status: "pass", notes: "" };
      }
    });
    
    // Include trailer items if asset type is trailer
    if (assetType === "trailer") {
      TRAILER_ITEMS.forEach(item => {
        if (!inspectionItems[item]) {
          allItems[item] = { status: "pass", notes: "" };
        }
      });
    }
    
    if (Object.keys(allItems).length > 0) {
      setInspectionItems(prev => ({ ...prev, ...allItems }));
    }
  }, [assetType]);

  const defectsCount = useMemo(() => {
    return Object.values(inspectionItems).filter(item => item.status === "fail").length;
  }, [inspectionItems]);

  const majorDefectPresent = defectsCount > 0;

  const reset = () => {
    setAssetType("vehicle");
    setAssetId("");
    setSelectedVehicle(null);
    setSelectedDriver(null);
    setDriverId("");
    setReportType("pre_trip");
    setOdometer("");
    setEngineHours("");
    setVerifyFix(false);
    setRemarks("");
    setConditionSatisfactory(false);
    setDefectsCorrected(false);
    setDefectsNotRequiredForSafety(false);
    setInspectionItems({});
    setExpandedSections({
      vehicle: true,
      trailer: false,
      sanitation: true,
      safety: true
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateInspectionItem = (itemKey: string, status: "pass" | "fail" | "na", notes?: string) => {
    setInspectionItems(prev => ({
      ...prev,
      [itemKey]: {
        status,
        notes: notes !== undefined ? notes : prev[itemKey]?.notes || ""
      }
    }));
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setAssetId(vehicle.id);
    setShowVehicleModal(false);
  };

  const handleDriverSelect = (driver: any) => {
    setSelectedDriver(driver);
    setDriverId(driver?.id || "");
    setShowDriverModal(false);
  };

  const handleSubmit = async () => {
    if (!assetId || (!odometer && !engineHours)) return;
    try {
      setSubmitting(true);
      
      // Build the inspection data
      const itemsData: Record<string, any> = {};
      Object.entries(inspectionItems).forEach(([key, value]) => {
        itemsData[key] = {
          result: value.status === "pass" ? "pass" : value.status === "fail" ? "fail" : "na",
          notes: value.notes,
          photos: []
        };
      });

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
          items: itemsData,
          defects_count: defectsCount,
          major_defect_present: majorDefectPresent,
          out_of_service_flag: majorDefectPresent,
          submitted_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error) throw error;

      // Create defect records for failed items
      if (majorDefectPresent && dvir) {
        const failedItems = Object.entries(inspectionItems).filter(([_, value]) => value.status === "fail");
        
        for (const [itemKey, _] of failedItems) {
          const { error: defErr } = await supabase.from("dvir_defects").insert({
            dvir_id: dvir.id,
            asset_type: assetType,
            asset_id: assetId,
            item_key: itemKey,
            severity: "major",
            status: "open",
          });
          if (defErr) throw defErr;
        }
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

  const renderInspectionSection = (categoryKey: string, category: { title: string, items: string[] }) => {
    const isExpanded = expandedSections[categoryKey];
    const sectionItems = category.items.filter(item => 
      categoryKey !== "trailer" || assetType === "trailer"
    );

    if (categoryKey === "trailer" && assetType !== "trailer") {
      return null;
    }

    return (
      <div key={categoryKey} className="border rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection(categoryKey)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50"
        >
          <h3 className="font-semibold text-foreground">{category.title}</h3>
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        
        {isExpanded && (
          <div className="p-4 pt-0 space-y-3">
            {sectionItems.map(item => {
              const itemData = inspectionItems[item] || { status: "pass", notes: "" };
              const itemLabel = item.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={item} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-sm">{itemLabel}</label>
                    <div className="flex gap-2">
                      {["pass", "fail", "na"].map(status => (
                        <label key={status} className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name={`${item}-status`}
                            checked={itemData.status === status}
                            onChange={() => updateInspectionItem(item, status as any)}
                            className="w-3 h-3"
                          />
                          <span className={`capitalize ${
                            status === "pass" ? "text-green-600" : 
                            status === "fail" ? "text-red-600" : 
                            "text-gray-600"
                          }`}>
                            {status === "na" ? "N/A" : status}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {itemData.status === "fail" && (
                    <Textarea
                      placeholder="Describe the defect..."
                      value={itemData.notes}
                      onChange={(e) => updateInspectionItem(item, "fail", e.target.value)}
                      className="w-full text-sm"
                      rows={2}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const formContent = (
    <div className="space-y-6">
      {/* Header Information */}
      <div className="bg-muted/20 p-4 rounded-lg">
        <h2 className="font-semibold text-lg mb-4">Header Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
...
        </div>
      </div>

      {/* Inspection Sections */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Inspection Items</h2>
        {Object.entries(INSPECTION_CATEGORIES).map(([key, category]) => 
          renderInspectionSection(key, category)
        )}
      </div>

      {/* Driver Certification */}
      <div className="bg-muted/20 p-4 rounded-lg space-y-4">
        <h2 className="font-semibold text-lg mb-4">Driver Certification</h2>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={conditionSatisfactory}
              onChange={(e) => setConditionSatisfactory(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">I certify the above vehicle is in satisfactory condition</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={defectsCorrected}
              onChange={(e) => setDefectsCorrected(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">Defects have been corrected</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={defectsNotRequiredForSafety}
              onChange={(e) => setDefectsNotRequiredForSafety(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">Defects listed are not required for safe operation</span>
          </label>

          {majorDefectPresent && (
            <label className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <input
                type="checkbox"
                checked={verifyFix}
                onChange={(e) => setVerifyFix(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-yellow-800">Verify all prior defects have been fixed</span>
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Additional Remarks</label>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any additional notes or comments..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={submitting || !assetId || (!odometer && !engineHours)}
        >
          {submitting ? "Submitting..." : "Submit DVIR"}
        </Button>
      </div>
    </div>
  );

  if (useModal) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Driver Vehicle Inspection Report (DVIR)</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="h-[95vh] max-h-none overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-bold">Driver Vehicle Inspection Report (DVIR)</SheetTitle>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  );
};