import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Droplets,
  Flame,
  AlertOctagon,
  FlaskConical,
  Battery,
  Utensils,
  Waves,
  HelpCircle,
  Search,
  Check
} from "lucide-react";

type SpillOption = {
  value: string;
  label: string;
  classification: string;
  color: string;
};

type SpillCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: SpillOption[];
};

const spillCategories: SpillCategory[] = [
  {
    id: "fuel-lubricants",
    label: "Fuel & Lubricants",
    icon: <Flame className="h-5 w-5" />,
    options: [
      { value: "gasoline", label: "Gasoline", classification: "Flammable", color: "text-red-500" },
      { value: "diesel", label: "Diesel", classification: "Combustible", color: "text-orange-500" },
      { value: "hydraulic-fluid", label: "Hydraulic Fluid", classification: "Oil", color: "text-amber-600" },
      { value: "motor-oil", label: "Motor Oil", classification: "Oil", color: "text-amber-700" },
      { value: "transmission-fluid", label: "Transmission Fluid", classification: "Oil", color: "text-amber-600" },
      { value: "brake-fluid", label: "Brake Fluid", classification: "Chemical", color: "text-yellow-600" },
    ]
  },
  {
    id: "sanitation-wastewater",
    label: "Sanitation & Wastewater",
    icon: <Droplets className="h-5 w-5" />,
    options: [
      { value: "septage", label: "Septage", classification: "Biohazard", color: "text-red-600" },
      { value: "portable-toilet-blue", label: "Portable Toilet Blue (Deodorizer)", classification: "Chemical", color: "text-blue-500" },
      { value: "blackwater", label: "Blackwater", classification: "Biohazard", color: "text-red-700" },
      { value: "greywater", label: "Greywater", classification: "Non-hazardous", color: "text-gray-500" },
    ]
  },
  {
    id: "chemicals-cleaners",
    label: "Chemicals & Cleaners",
    icon: <FlaskConical className="h-5 w-5" />,
    options: [
      { value: "disinfectant-quats", label: "Disinfectant (Quats)", classification: "Chemical", color: "text-purple-500" },
      { value: "bleach", label: "Bleach (Sodium Hypochlorite)", classification: "Corrosive", color: "text-yellow-500" },
      { value: "acidic-cleaner", label: "Acidic Cleaner (Descaler)", classification: "Corrosive", color: "text-orange-600" },
      { value: "alkaline-degreaser", label: "Alkaline Degreaser", classification: "Corrosive", color: "text-orange-500" },
      { value: "solvent-based-cleaner", label: "Solvent-Based Cleaner", classification: "Flammable", color: "text-red-500" },
      { value: "hydrogen-peroxide", label: "Hydrogen Peroxide", classification: "Oxidizer", color: "text-cyan-500" },
      { value: "ammonia-solution", label: "Ammonia Solution", classification: "Corrosive", color: "text-yellow-600" },
    ]
  },
  {
    id: "coolants-batteries",
    label: "Coolants & Batteries",
    icon: <Battery className="h-5 w-5" />,
    options: [
      { value: "antifreeze-coolant", label: "Antifreeze / Coolant (Ethylene/Propylene Glycol)", classification: "Chemical", color: "text-green-500" },
      { value: "battery-acid", label: "Battery Acid (Sulfuric Acid)", classification: "Corrosive", color: "text-red-600" },
    ]
  },
  {
    id: "grease-food-waste",
    label: "Grease & Food Waste",
    icon: <Utensils className="h-5 w-5" />,
    options: [
      { value: "grease-trap-waste", label: "Grease Trap Waste", classification: "Biohazard / Oil", color: "text-amber-700" },
      { value: "cooking-oil", label: "Cooking Oil", classification: "Oil", color: "text-amber-600" },
    ]
  },
  {
    id: "water-non-hazardous",
    label: "Water / Non-Hazardous",
    icon: <Waves className="h-5 w-5" />,
    options: [
      { value: "potable-water", label: "Potable Water", classification: "Non-hazardous", color: "text-blue-400" },
      { value: "wash-water", label: "Wash Water", classification: "Non-hazardous", color: "text-blue-300" },
      { value: "stormwater", label: "Stormwater", classification: "Non-hazardous", color: "text-gray-400" },
    ]
  },
  {
    id: "other-unknown",
    label: "Other / Unknown",
    icon: <HelpCircle className="h-5 w-5" />,
    options: [
      { value: "mixed-spill", label: "Mixed Spill (multiple substances)", classification: "Various", color: "text-gray-600" },
      { value: "unknown-substance", label: "Unknown Substance", classification: "Unknown", color: "text-gray-700" },
      { value: "other", label: "Other (free text)", classification: "Other", color: "text-gray-600" },
    ]
  }
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (spillType: string, classification: string) => void;
  currentValue?: string;
};

export const SpillTypeSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect, currentValue = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>(currentValue);
  const [otherDescription, setOtherDescription] = useState("");

  // Update selected type when modal opens with new currentValue
  useEffect(() => {
    if (currentValue.startsWith("other:")) {
      setOtherDescription(currentValue.substring(6).trim());
      setSelectedType("other");
    } else {
      setSelectedType(currentValue);
      setOtherDescription("");
    }
  }, [isOpen, currentValue]);

  const handleSelectType = (value: string, classification: string, label: string) => {
    // If "other" is selected, don't auto-close - wait for description
    if (value === "other") {
      setSelectedType(value);
      return;
    }
    
    // For all other types, immediately apply and close
    onSelect(label, classification);
    onClose();
    setOtherDescription("");
    setSelectedType("");
  };

  const handleApplyOther = () => {
    if (selectedType === "other" && otherDescription.trim()) {
      const finalType = `other: ${otherDescription.trim()}`;
      onSelect(finalType, "Other");
      onClose();
      setOtherDescription("");
      setSelectedType("");
    }
  };

  // Filter categories based on search query
  const filteredCategories = spillCategories.map(category => ({
    ...category,
    options: category.options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.classification.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.options.length > 0);

  const selectedOption = spillCategories
    .flatMap(cat => cat.options)
    .find(opt => opt.value === selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-500" />
              Select Spill Type
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spill types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected type preview */}
          {selectedType && selectedType !== "other" && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              <Badge variant="default" className="gap-2">
                <span className="font-semibold">
                  {selectedOption?.label || selectedType}
                </span>
                {selectedOption && (
                  <span className="opacity-80">• {selectedOption.classification}</span>
                )}
              </Badge>
            </div>
          )}

          {/* Category accordion */}
          <Accordion type="single" collapsible className="w-full">
            {filteredCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">{category.icon}</div>
                    <span className="font-semibold">{category.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {category.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors text-left"
                        onClick={() => handleSelectType(option.value, option.classification, option.label)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            Classification: <span className={`font-medium ${option.color}`}>{option.classification}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Other description field */}
          {selectedType === "other" && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="other-description" className="text-sm font-semibold">
                Other Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="other-description"
                placeholder="Please describe the spill type..."
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                className="w-full"
                required
              />
              <Button 
                onClick={handleApplyOther}
                disabled={!otherDescription.trim()}
                className="w-full"
              >
                Apply Other Type
              </Button>
            </div>
          )}

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No spill types match your search
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
