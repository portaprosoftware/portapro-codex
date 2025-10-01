import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Shield } from "lucide-react";

type PPEItem = {
  value: string;
  label: string;
};

type PPECategory = {
  id: string;
  label: string;
  items: PPEItem[];
};

const ppeCategories: PPECategory[] = [
  {
    id: "hand",
    label: "Hand Protection",
    items: [
      { value: "gloves_chemical", label: "Gloves (Chemical)" },
      { value: "gloves_utility", label: "Gloves (Utility)" },
      { value: "gloves_heavy_duty", label: "Heavy-Duty Gloves" },
    ]
  },
  {
    id: "respiratory",
    label: "Respiratory Protection",
    items: [
      { value: "n95_mask", label: "N95 Mask" },
      { value: "respirator", label: "Respirator" },
      { value: "full_face_shield", label: "Full Face Shield" },
    ]
  },
  {
    id: "eye",
    label: "Eye Protection",
    items: [
      { value: "safety_goggles", label: "Safety Goggles" },
      { value: "face_shield", label: "Face Shield" },
    ]
  },
  {
    id: "body",
    label: "Body Protection",
    items: [
      { value: "tyvek_suit", label: "Tyvek Suit" },
      { value: "apron", label: "Apron" },
      { value: "coveralls", label: "Coveralls" },
      { value: "rubber_boots", label: "Rubber Boots" },
    ]
  },
  {
    id: "general_field",
    label: "General Field Safety",
    items: [
      { value: "hearing_protection", label: "Hearing Protection (Earplugs/Earmuffs)" },
      { value: "hi_vis_vest", label: "High-Visibility Vest (Hi-Vis)" },
    ]
  },
  {
    id: "other",
    label: "Other",
    items: [
      { value: "other", label: "Other (Custom)" },
    ]
  }
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: string[]) => void;
  currentValue?: string[];
};

export const PPESelectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelect,
  currentValue = []
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(currentValue);
  const [otherDescription, setOtherDescription] = useState("");

  useEffect(() => {
    const parsedItems: string[] = [];
    currentValue.forEach(v => {
      if (v.startsWith("other:")) {
        setOtherDescription(v.substring(6).trim());
        parsedItems.push("other");
      } else {
        parsedItems.push(v);
      }
    });
    setSelectedItems(parsedItems);
  }, [isOpen, currentValue]);

  const toggleItem = (value: string) => {
    setSelectedItems(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleApply = () => {
    if (selectedItems.includes("other") && !otherDescription.trim()) {
      return;
    }

    const finalItems = selectedItems.map(item =>
      item === "other" ? `other: ${otherDescription.trim()}` : item
    );

    onSelect(finalItems);
    onClose();
    setOtherDescription("");
  };

  const handleClear = () => {
    setSelectedItems([]);
    setOtherDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Select PPE Used
            </div>
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedItems.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected items preview */}
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              {selectedItems.map(value => {
                const item = ppeCategories
                  .flatMap(cat => cat.items)
                  .find(i => i.value === value);
                
                if (!item) return null;
                
                const displayText = item.label + 
                  (value === "other" && otherDescription ? `: ${otherDescription}` : '');
                
                return (
                  <Badge key={value} variant="default">
                    {displayText}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Category accordion */}
          <Accordion type="multiple" defaultValue={["hand", "respiratory"]} className="w-full">
            {ppeCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{category.label}</span>
                    <Badge variant="outline" className="ml-2">
                      {category.items.filter(item => selectedItems.includes(item.value)).length}/
                      {category.items.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {category.items.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedItems.includes(item.value)}
                          onCheckedChange={() => toggleItem(item.value)}
                        />
                        <span className="font-medium flex-1">{item.label}</span>
                        {selectedItems.includes(item.value) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Other description field */}
          {selectedItems.includes("other") && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="other-ppe" className="text-sm font-semibold">
                Other PPE Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="other-ppe"
                placeholder="Describe the PPE used..."
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                className="w-full"
              />
              {selectedItems.includes("other") && !otherDescription.trim() && (
                <p className="text-sm text-red-500">Description is required when "Other" is selected</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={handleClear} disabled={selectedItems.length === 0}>
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={selectedItems.includes("other") && !otherDescription.trim()}
            >
              Apply ({selectedItems.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
