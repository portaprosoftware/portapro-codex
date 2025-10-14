import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";

export interface MaintenanceFilters {
  dateRange: { from: Date | undefined; to: Date | undefined };
  productType: string;
  technician: string;
  costMin: string;
  costMax: string;
  outcome: string;
  searchTerm: string;
}

interface MaintenanceHistoryFiltersProps {
  filters: MaintenanceFilters;
  onFilterChange: (filters: MaintenanceFilters) => void;
  productTypes: { id: string; name: string }[];
  technicians: string[];
}

export const MaintenanceHistoryFilters: React.FC<MaintenanceHistoryFiltersProps> = ({
  filters,
  onFilterChange,
  productTypes,
  technicians,
}) => {
  const handleReset = () => {
    onFilterChange({
      dateRange: { from: undefined, to: undefined },
      productType: "all",
      technician: "all",
      costMin: "",
      costMax: "",
      outcome: "all",
      searchTerm: "",
    });
  };

  const activeFilterCount = [
    filters.productType !== "all",
    filters.technician !== "all",
    filters.costMin,
    filters.costMax,
    filters.outcome !== "all",
    filters.dateRange.from || filters.dateRange.to,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filters - Always Visible */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center justify-end mb-4">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={filters.dateRange}
                  onSelect={(range) =>
                    onFilterChange({
                      ...filters,
                      dateRange: { from: range?.from, to: range?.to },
                    })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Product Type */}
          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select
              value={filters.productType}
              onValueChange={(value) => onFilterChange({ ...filters, productType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Technician */}
          <div className="space-y-2">
            <Label>Technician</Label>
            <Select
              value={filters.technician}
              onValueChange={(value) => onFilterChange({ ...filters, technician: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Technicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Range */}
          <div className="space-y-2">
            <Label>Min Cost ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.costMin}
              onChange={(e) => onFilterChange({ ...filters, costMin: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Cost ($)</Label>
            <Input
              type="number"
              placeholder="10000"
              value={filters.costMax}
              onChange={(e) => onFilterChange({ ...filters, costMax: e.target.value })}
            />
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label>Outcome</Label>
            <Select
              value={filters.outcome}
              onValueChange={(value) => onFilterChange({ ...filters, outcome: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="returned">Returned to Service</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Search Bar - Below Filters */}
      <div className="flex-1">
        <Input
          placeholder="Search by item code, summary, or technician..."
          value={filters.searchTerm}
          onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
          className="max-w-md"
        />
      </div>
    </div>
  );
};
