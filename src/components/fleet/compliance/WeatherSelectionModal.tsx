import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Search
} from "lucide-react";

type WeatherOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
};

const weatherOptions: WeatherOption[] = [
  { value: "clear", label: "Clear", icon: <Sun className="h-8 w-8" />, color: "text-yellow-500" },
  { value: "cloudy", label: "Cloudy", icon: <Cloud className="h-8 w-8" />, color: "text-gray-500" },
  { value: "rainy", label: "Rainy", icon: <CloudRain className="h-8 w-8" />, color: "text-blue-500" },
  { value: "snowy", label: "Snowy", icon: <Snowflake className="h-8 w-8" />, color: "text-blue-300" },
  { value: "windy", label: "Windy", icon: <Wind className="h-8 w-8" />, color: "text-teal-500" },
  { value: "foggy", label: "Foggy", icon: <CloudFog className="h-8 w-8" />, color: "text-gray-400" },
  { value: "icy", label: "Icy", icon: <Droplets className="h-8 w-8" />, color: "text-cyan-400" },
  { value: "hot", label: "Hot", icon: <ThermometerSun className="h-8 w-8" />, color: "text-red-500" },
  { value: "cold", label: "Cold", icon: <ThermometerSnowflake className="h-8 w-8" />, color: "text-blue-600" },
  { value: "storm", label: "Storm / Severe Weather", icon: <CloudLightning className="h-8 w-8" />, color: "text-purple-600" },
  { value: "other", label: "Other", icon: <HelpCircle className="h-8 w-8" />, color: "text-gray-600" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (weather: string) => void;
  currentValue?: string;
};

export const WeatherSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect, currentValue }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = weatherOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Cloud className="h-5 w-5" />
            Select Weather Conditions
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search weather conditions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`
                p-6 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-105
                ${currentValue === option.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-primary/50'
                }
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={option.color}>
                  {option.icon}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">{option.label}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredOptions.length} condition{filteredOptions.length !== 1 ? 's' : ''} available
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
