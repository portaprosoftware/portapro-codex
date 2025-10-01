import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Car } from "lucide-react";

type VehicleArea = {
  value: string;
  label: string;
};

type VehicleAreaCategory = {
  category: string;
  areas: VehicleArea[];
};

const vehicleAreaCategories: VehicleAreaCategory[] = [
  {
    category: "Vehicle Systems",
    areas: [
      { value: "engine_bay", label: "Engine Bay" },
      { value: "tank_holding_system", label: "Tank / Holding System" },
      { value: "pump_system", label: "Pump System" },
      { value: "water_refill_system", label: "Water Refill System" },
      { value: "wheels_tires", label: "Wheels / Tires" },
      { value: "undercarriage", label: "Undercarriage" },
    ],
  },
  {
    category: "Contact & Work Areas",
    areas: [
      { value: "exterior", label: "Exterior" },
      { value: "interior_cabin", label: "Interior / Cabin" },
      { value: "liftgate_rear_platform", label: "Liftgate / Rear Platform" },
      { value: "storage_compartments", label: "Storage Compartments / Toolboxes" },
    ],
  },
  {
    category: "High-Risk Components",
    areas: [
      { value: "hoses_lines", label: "Hoses / Lines" },
      { value: "valves_couplings", label: "Valves / Couplings" },
    ],
  },
  {
    category: "Safety Equipment",
    areas: [
      { value: "ppe_equipment", label: "PPE / Equipment" },
    ],
  },
  {
    category: "Other",
    areas: [
      { value: "other", label: "Other" },
    ],
  },
];

const allVehicleAreas = vehicleAreaCategories.flatMap(cat => cat.areas);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (areas: string[]) => void;
  currentValue?: string[];
};

export const VehicleAreaSelectionModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentValue = [] 
}) => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(currentValue);
  const [otherDescription, setOtherDescription] = useState("");

  useEffect(() => {
    const parsedAreas: string[] = [];
    currentValue.forEach(v => {
      if (v.startsWith("other:")) {
        setOtherDescription(v.substring(6).trim());
        parsedAreas.push("other");
      } else {
        parsedAreas.push(v);
      }
    });
    setSelectedAreas(parsedAreas);
  }, [isOpen, currentValue]);

  const toggleArea = (value: string) => {
    setSelectedAreas(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value) 
        : [...prev, value]
    );
  };

  const handleApply = () => {
    if (selectedAreas.includes("other") && !otherDescription.trim()) {
      return;
    }

    const finalAreas = selectedAreas.map(area => 
      area === "other" ? `other: ${otherDescription.trim()}` : area
    );

    onSelect(finalAreas);
    onClose();
    setOtherDescription("");
  };

  const handleClear = () => {
    setSelectedAreas([]);
    setOtherDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Select Vehicle Areas
            </div>
            {selectedAreas.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedAreas.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected areas preview */}
          {selectedAreas.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              {selectedAreas.map(value => {
                const area = allVehicleAreas.find(a => a.value === value);
                if (!area) return null;
                
                const displayText = area.label + 
                  (value === "other" && otherDescription ? `: ${otherDescription}` : '');
                
                return (
                  <Badge key={value} variant="default">
                    {displayText}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Area checkboxes - Categorized */}
          <div className="space-y-4">
            {vehicleAreaCategories.map((category) => (
              <div key={category.category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.areas.map((area) => (
                    <label 
                      key={area.value}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedAreas.includes(area.value)}
                        onCheckedChange={() => toggleArea(area.value)}
                      />
                      <span className="font-medium flex-1">{area.label}</span>
                      {selectedAreas.includes(area.value) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Other description field */}
          {selectedAreas.includes("other") && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="other-area" className="text-sm font-semibold">
                Other Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="other-area"
                placeholder="Describe the area..."
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                className="w-full"
              />
              {selectedAreas.includes("other") && !otherDescription.trim() && (
                <p className="text-sm text-red-500">Description is required when "Other" is selected</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={handleClear} disabled={selectedAreas.length === 0}>
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={selectedAreas.includes("other") && !otherDescription.trim()}
            >
              Apply ({selectedAreas.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
