import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type SpillKitType = {
  value: string;
  label: string;
  description: string;
  examples: string[];
};

const SPILL_KIT_TYPES: SpillKitType[] = [
  {
    value: 'absorbent',
    label: 'Absorbents',
    description: 'Materials that soak up and contain spills',
    examples: ['Pads', 'Rolls', 'Booms', 'Pillows', 'Granular absorbent']
  },
  {
    value: 'containment',
    label: 'Containment & Control',
    description: 'Equipment to prevent spill spread and control flow',
    examples: ['Drain covers', 'Dikes/berms', 'Leak-stoppers', 'Plugs', 'Manhole covers', 'Drip pans']
  },
  {
    value: 'ppe',
    label: 'PPE (Personal Protective Equipment)',
    description: 'Safety gear for personnel handling spills',
    examples: ['Nitrile gloves', 'Goggles', 'Face shield', 'Tyvek suit', 'Boots', 'Respirator cartridges']
  },
  {
    value: 'decon',
    label: 'Decon & Cleaning',
    description: 'Disinfection and cleaning supplies',
    examples: ['Disinfectant/quat', 'Bleach solution', 'Wipes', 'Scrub brush', 'Spray bottles']
  },
  {
    value: 'tools',
    label: 'Tools & Hardware',
    description: 'Hand tools and equipment for spill response',
    examples: ['Scoop/scraper', 'Utility knife', 'Hose clamps', 'Zip ties', 'Wrenches']
  },
  {
    value: 'disposal',
    label: 'Disposal & Packaging',
    description: 'Waste containment and disposal materials',
    examples: ['Red/black bags', 'Bag ties', 'Labels', 'Buckets', 'Overpack drum', 'Absorbent waste sacks']
  },
  {
    value: 'documentation',
    label: 'Documentation & Labels',
    description: 'Required forms and identification materials',
    examples: ['SDS sheets', 'Incident forms', 'Chain-of-custody', 'Waste labels', 'Markers']
  },
  {
    value: 'pump_transfer',
    label: 'Pump / Transfer (Sanitation)',
    description: 'Equipment for waste transfer operations',
    examples: ['Vacuum hose', 'Camlock fittings/caps', 'Plugs', 'Hose gaskets']
  },
  {
    value: 'signage',
    label: 'Signage & Safety',
    description: 'Warning and safety equipment',
    examples: ['Safety cones', 'Caution tape', 'Flashlight/headlamp', 'Wheel chocks']
  },
  {
    value: 'other',
    label: 'General / Other',
    description: 'Custom or miscellaneous items',
    examples: ['Custom items', 'Specialized equipment']
  }
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  currentValue?: string;
};

export function SpillKitTypeSelectionModal({ isOpen, onClose, onSelect, currentValue }: Props) {
  const [selectedType, setSelectedType] = useState<string>(currentValue || '');

  const handleSelect = (typeValue: string) => {
    setSelectedType(typeValue);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedType(currentValue || '');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }} modal={true}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-background" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Select Spill Kit Item Type</DialogTitle>
          <DialogDescription>
            Choose the category that best describes this spill kit component
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid gap-3">
            {SPILL_KIT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(type.value);
                }}
                type="button"
                className={cn(
                  "relative flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left hover:border-primary/50 hover:bg-accent/50",
                  selectedType === type.value
                    ? "border-primary bg-accent"
                    : "border-border bg-card"
                )}
              >
                {selectedType === type.value && (
                  <div className="absolute top-3 right-3">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                <div className="flex-1 w-full pr-8">
                  <div className="mb-2">
                    <h3 className="font-semibold text-base">{type.label}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {type.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {type.examples.map((example, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedType}>
            Select Type
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
