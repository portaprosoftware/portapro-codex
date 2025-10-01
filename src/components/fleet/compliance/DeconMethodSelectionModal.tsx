import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Sparkles } from "lucide-react";

type DeconMethod = {
  value: string;
  label: string;
};

type MethodCategory = {
  id: string;
  label: string;
  methods: DeconMethod[];
};

const methodCategories: MethodCategory[] = [
  {
    id: "mechanical",
    label: "Mechanical Methods",
    methods: [
      { value: "pressure_wash_cold", label: "Pressure Wash (Cold)" },
      { value: "pressure_wash_hot", label: "Pressure Wash (Hot)" },
      { value: "steam_cleaning", label: "Steam Cleaning" },
      { value: "manual_scrubbing", label: "Manual Scrubbing" },
      { value: "brush_cleaning", label: "Brush Cleaning" },
    ]
  },
  {
    id: "chemical",
    label: "Chemical Methods",
    methods: [
      { value: "bleach_solution", label: "Bleach Solution" },
      { value: "quat_ammonium", label: "Quaternary Ammonium (Quat)" },
      { value: "specialized_neutralizer", label: "Specialized Neutralizer" },
      { value: "epa_disinfectant", label: "EPA-Registered Disinfectant" },
      { value: "enzymatic_cleaner", label: "Enzymatic Cleaner" },
    ]
  },
  {
    id: "surface",
    label: "Surface Treatments",
    methods: [
      { value: "disinfectant_wipes", label: "Disinfectant Wipes" },
      { value: "spray_wipe", label: "Spray & Wipe Protocol" },
      { value: "foaming_agent", label: "Foaming Agent Application" },
    ]
  },
  {
    id: "special",
    label: "Special Procedures",
    methods: [
      { value: "tank_flush", label: "Tank Flush/Rinse" },
      { value: "pump_purge", label: "Pump System Purge" },
      { value: "line_flushing", label: "Line Flushing" },
      { value: "containment_decon", label: "Containment Area Decon" },
      { value: "hazmat_disposal", label: "Hazmat Disposal" },
    ]
  }
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (methods: string[]) => void;
  currentValue?: string[];
};

export const DeconMethodSelectionModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentValue = [] 
}) => {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(currentValue);

  useEffect(() => {
    setSelectedMethods(currentValue);
  }, [isOpen, currentValue]);

  const toggleMethod = (value: string) => {
    setSelectedMethods(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value) 
        : [...prev, value]
    );
  };

  const handleApply = () => {
    onSelect(selectedMethods);
    onClose();
  };

  const handleClear = () => {
    setSelectedMethods([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Select Decontamination Methods
            </div>
            {selectedMethods.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedMethods.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected methods preview */}
          {selectedMethods.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              {selectedMethods.map(value => {
                const method = methodCategories
                  .flatMap(cat => cat.methods)
                  .find(m => m.value === value);
                
                if (!method) return null;
                
                return (
                  <Badge key={value} variant="default">
                    {method.label}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Category accordion */}
          <Accordion type="multiple" defaultValue={["mechanical", "chemical"]} className="w-full">
            {methodCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{category.label}</span>
                    <Badge variant="outline" className="ml-2">
                      {category.methods.filter(method => selectedMethods.includes(method.value)).length}/
                      {category.methods.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {category.methods.map((method) => (
                      <label
                        key={method.value}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedMethods.includes(method.value)}
                          onCheckedChange={() => toggleMethod(method.value)}
                        />
                        <span className="font-medium flex-1">{method.label}</span>
                        {selectedMethods.includes(method.value) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={handleClear} disabled={selectedMethods.length === 0}>
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply ({selectedMethods.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};