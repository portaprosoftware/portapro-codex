
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AttributeFiltersProps {
  filters: {
    color?: string;
    size?: string;
    material?: string;
    condition?: string;
  };
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearFilters: () => void;
}

export const AttributeFilters: React.FC<AttributeFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const hasActiveFilters = Object.values(filters).some(value => value && value !== "all");

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Filter by Attributes</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <Select value={filters.color || "all"} onValueChange={(value) => onFilterChange("color", value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any Color" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Any Color</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="tan">Tan</SelectItem>
              <SelectItem value="gray">Gray</SelectItem>
              <SelectItem value="white">White</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
          <Select value={filters.size || "all"} onValueChange={(value) => onFilterChange("size", value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any Size" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Any Size</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="ada">ADA Compliant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
          <Select value={filters.material || "all"} onValueChange={(value) => onFilterChange("material", value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any Material" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Any Material</SelectItem>
              <SelectItem value="plastic">Plastic</SelectItem>
              <SelectItem value="fiberglass">Fiberglass</SelectItem>
              <SelectItem value="metal">Metal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <Select value={filters.condition || "all"} onValueChange={(value) => onFilterChange("condition", value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any Condition" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Any Condition</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="needs_repair">Needs Repair</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
