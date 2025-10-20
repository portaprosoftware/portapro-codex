import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toilet, MapPin, Wrench, FileDigit, BarChart3 } from "lucide-react";

interface MobileTabSelectProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabOptions = [
  { value: "products", label: "Equipment", icon: Toilet },
  { value: "location-map", label: "Location Map", icon: MapPin },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "code-categories", label: "Series Assignments", icon: FileDigit },
];

export const MobileTabSelect: React.FC<MobileTabSelectProps> = ({
  activeTab,
  onTabChange,
}) => {
  const activeTabConfig = tabOptions.find(t => t.value === activeTab);

  return (
    <div className="space-y-3">
      {/* Main Select Dropdown */}
      <Select value={activeTab} onValueChange={onTabChange}>
        <SelectTrigger className="h-12 text-base">
          <SelectValue>
            {activeTabConfig && (
              <div className="flex items-center gap-2">
                <activeTabConfig.icon className="h-4 w-4" />
                {activeTabConfig.label}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tabOptions.map((tab) => (
            <SelectItem key={tab.value} value={tab.value}>
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Optional Quick Chips for Most Used Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange("products")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            activeTab === "products"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-600"
          }`}
        >
          <Toilet className="h-4 w-4" />
          Equipment
        </button>
        <button
          onClick={() => onTabChange("location-map")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            activeTab === "location-map"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-600"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Map
        </button>
      </div>
    </div>
  );
};
