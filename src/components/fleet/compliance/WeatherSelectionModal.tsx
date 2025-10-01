import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Wind, 
  CloudFog, 
  Droplets, 
  ThermometerSun, 
  ThermometerSnowflake, 
  CloudLightning,
  HelpCircle,
  Search,
  Check
} from "lucide-react";

type WeatherOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
};

type WeatherCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: WeatherOption[];
};

const weatherCategories: WeatherCategory[] = [
  {
    id: "general",
    label: "General",
    icon: <Sun className="h-5 w-5" />,
    options: [
      { value: "clear", label: "Clear", icon: <Sun className="h-5 w-5" />, color: "text-yellow-500" },
      { value: "cloudy", label: "Cloudy", icon: <Cloud className="h-5 w-5" />, color: "text-gray-500" },
    ]
  },
  {
    id: "precipitation",
    label: "Precipitation",
    icon: <CloudRain className="h-5 w-5" />,
    options: [
      { value: "rainy", label: "Rainy", icon: <CloudRain className="h-5 w-5" />, color: "text-blue-500" },
      { value: "snowy", label: "Snowy", icon: <Snowflake className="h-5 w-5" />, color: "text-blue-300" },
      { value: "foggy", label: "Foggy", icon: <CloudFog className="h-5 w-5" />, color: "text-gray-400" },
    ]
  },
  {
    id: "wind-storm",
    label: "Wind & Storm",
    icon: <Wind className="h-5 w-5" />,
    options: [
      { value: "windy", label: "Windy", icon: <Wind className="h-5 w-5" />, color: "text-teal-500" },
      { value: "storm", label: "Storm / Severe Weather", icon: <CloudLightning className="h-5 w-5" />, color: "text-purple-600" },
    ]
  },
  {
    id: "temperature",
    label: "Temperature / Seasonal",
    icon: <ThermometerSun className="h-5 w-5" />,
    options: [
      { value: "hot", label: "Hot", icon: <ThermometerSun className="h-5 w-5" />, color: "text-red-500" },
      { value: "cold", label: "Cold", icon: <ThermometerSnowflake className="h-5 w-5" />, color: "text-blue-600" },
      { value: "icy", label: "Icy", icon: <Droplets className="h-5 w-5" />, color: "text-cyan-400" },
    ]
  },
  {
    id: "other",
    label: "Other",
    icon: <HelpCircle className="h-5 w-5" />,
    options: [
      { value: "other", label: "Other", icon: <HelpCircle className="h-5 w-5" />, color: "text-gray-600" },
    ]
  }
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (weather: string[]) => void;
  currentValue?: string[];
};

export const WeatherSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect, currentValue = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>(currentValue);

  // Update selected conditions when modal opens with new currentValue
  useEffect(() => {
    setSelectedConditions(currentValue);
  }, [isOpen, currentValue]);

  const toggleCondition = (value: string) => {
    setSelectedConditions(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleApply = () => {
    onSelect(selectedConditions);
    onClose();
  };

  const handleClear = () => {
    setSelectedConditions([]);
  };

  // Filter categories based on search query
  const filteredCategories = weatherCategories.map(category => ({
    ...category,
    options: category.options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.options.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Select Weather Conditions
            </div>
            {selectedConditions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedConditions.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search weather conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected conditions preview */}
          {selectedConditions.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              {selectedConditions.map(value => {
                const option = weatherCategories
                  .flatMap(cat => cat.options)
                  .find(opt => opt.value === value);
                return option ? (
                  <Badge key={value} variant="default" className="gap-1">
                    {option.label}
                  </Badge>
                ) : null;
              })}
            </div>
          )}

          {/* Category accordion */}
          <Accordion type="multiple" defaultValue={["general", "precipitation"]} className="w-full">
            {filteredCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">{category.icon}</div>
                    <span className="font-semibold">{category.label}</span>
                    <Badge variant="outline" className="ml-2">
                      {category.options.filter(opt => selectedConditions.includes(opt.value)).length}/
                      {category.options.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {category.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedConditions.includes(option.value)}
                          onCheckedChange={() => toggleCondition(option.value)}
                        />
                        <div className={`${option.color} shrink-0`}>
                          {option.icon}
                        </div>
                        <span className="font-medium">{option.label}</span>
                        {selectedConditions.includes(option.value) && (
                          <Check className="h-4 w-4 ml-auto text-primary" />
                        )}
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No weather conditions match your search
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={handleClear} disabled={selectedConditions.length === 0}>
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply ({selectedConditions.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
