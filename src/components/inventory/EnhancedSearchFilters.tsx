import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface EnhancedSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    availability?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const EnhancedSearchFilters: React.FC<EnhancedSearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters
}) => {

  const updateFilter = (key: string, value: any) => {
    console.log("EnhancedSearchFilters: Updating filter", key, "to", value);
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== "" && value !== "all"
  );

  return (
    <div className="space-y-4">
      {/* Primary Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by item code, tool number, vendor ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.availability || "all"} onValueChange={(value) => updateFilter("availability", value)}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="All Availability" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="all">All Availability</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">On Job</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="out_of_service">Permanently Retired</SelectItem>
          </SelectContent>
        </Select>


        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters} size="sm">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

    </div>
  );
};