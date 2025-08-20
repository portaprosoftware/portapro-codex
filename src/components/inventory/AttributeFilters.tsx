
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch dynamic attribute options from product_properties
  const { data: attributeOptions = { color: [], size: [], material: [], condition: [] } } = useQuery({
    queryKey: ['attribute-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_properties')
        .select('attribute_name, attribute_value')
        .not('attribute_value', 'is', null);
      
      if (error) throw error;
      
      // Group by attribute type
      const options: Record<string, string[]> = {
        color: [],
        size: [],
        material: [],
        condition: []
      };
      
      data?.forEach(item => {
        const attrName = item.attribute_name.toLowerCase();
        const attrValue = item.attribute_value;
        
        if (attrValue && options[attrName] && !options[attrName].includes(attrValue)) {
          options[attrName].push(attrValue);
        }
      });
      
      // Sort each array
      Object.keys(options).forEach(key => {
        options[key].sort();
      });
      
      return options;
    },
  });

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
              {attributeOptions.color.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
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
              {attributeOptions.size.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
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
              {attributeOptions.material.map((material) => (
                <SelectItem key={material} value={material}>
                  {material}
                </SelectItem>
              ))}
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
              {attributeOptions.condition.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
