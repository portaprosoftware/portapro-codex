import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, X, Calendar, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface EnhancedSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    availability?: string;
    toolNumber?: string;
    vendorId?: string;
    verificationStatus?: string;
    manufacturingDateRange?: DateRange;
    confidenceRange?: [number, number];
    attributes?: Record<string, string>;
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confidence, setConfidence] = useState(filters.confidenceRange || [0, 100]);

  const updateFilter = (key: string, value: any) => {
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
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Availability</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="maintenance">In Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "border-gray-300",
            showAdvanced && "bg-blue-50 border-blue-300 text-blue-700"
          )}
        >
          <Filter className="w-4 h-4 mr-2" />
          Panel Data
        </Button>

        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters} size="sm">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tool Number Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Tool Number
              </label>
              <Input
                placeholder="e.g., T-20788-1A"
                value={filters.toolNumber || ""}
                onChange={(e) => updateFilter("toolNumber", e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Vendor ID Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Vendor ID</label>
              <Input
                placeholder="e.g., 32293"
                value={filters.vendorId || ""}
                onChange={(e) => updateFilter("vendorId", e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Verification Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Verification Status
              </label>
              <Select 
                value={filters.verificationStatus || "all"} 
                onValueChange={(value) => updateFilter("verificationStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="manual_verified">Verified</SelectItem>
                  <SelectItem value="auto_detected">Auto-detected</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Manufacturing Date Range
            </label>
            <DatePickerWithRange
              date={filters.manufacturingDateRange}
              onDateChange={(dateRange) => updateFilter("manufacturingDateRange", dateRange)}
            />
          </div>

          {/* Confidence Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              OCR Confidence: {confidence[0]}% - {confidence[1]}%
            </label>
            <Slider
              value={confidence}
              onValueChange={(value) => {
                setConfidence(value as [number, number]);
                updateFilter("confidenceRange", value);
              }}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {filters.toolNumber && (
                  <Badge variant="outline" className="gap-1">
                    Tool: {filters.toolNumber}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter("toolNumber", "")} />
                  </Badge>
                )}
                {filters.vendorId && (
                  <Badge variant="outline" className="gap-1">
                    Vendor: {filters.vendorId}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter("vendorId", "")} />
                  </Badge>
                )}
                {filters.verificationStatus && filters.verificationStatus !== "all" && (
                  <Badge variant="outline" className="gap-1">
                    Status: {filters.verificationStatus}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter("verificationStatus", "all")} />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};