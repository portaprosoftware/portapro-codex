import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Download, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { EquipmentFilterModal } from "./EquipmentFilterModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  onExport: () => void;
  exportDisabled: boolean;
}

export const MaintenanceHistoryFilters: React.FC<MaintenanceHistoryFiltersProps> = ({
  filters,
  onFilterChange,
  productTypes,
  technicians,
  onExport,
  exportDisabled,
}) => {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
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
      {/* Collapsible Filters */}
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <div className="bg-gray-50 border rounded-lg">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-4 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="p-4 pt-0">
              {activeFilterCount > 0 && (
                <div className="flex items-center justify-end mb-3">
                  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-xs">
                    <X className="w-3 h-3" />
                    Clear All
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-xs">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal text-xs">
                        <CalendarIcon className="mr-2 h-3 w-3" />
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

                {/* Product Type - Filter by Equipment Button */}
                <div className="space-y-2">
                  <Label className="text-xs">Product Type</Label>
                  <Button
                    variant="outline"
                    onClick={() => setFilterModalOpen(true)}
                    className="w-full justify-start text-left font-normal text-xs"
                  >
                    <Filter className="mr-2 h-3 w-3" />
                    {filters.productType === "all" 
                      ? "All Products" 
                      : productTypes.find(p => p.id === filters.productType)?.name || "Select products"}
                    {filters.productType !== "all" && (
                      <Badge className="ml-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                        1
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Technician */}
                <div className="space-y-2">
                  <Label className="text-xs">Technician</Label>
                  <Select
                    value={filters.technician}
                    onValueChange={(value) => onFilterChange({ ...filters, technician: value })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="All Technicians" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Technicians</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech} value={tech} className="text-xs">
                          {tech}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cost Range */}
                <div className="space-y-2">
                  <Label className="text-xs">Min Cost ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.costMin}
                    onChange={(e) => onFilterChange({ ...filters, costMin: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Max Cost ($)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={filters.costMax}
                    onChange={(e) => onFilterChange({ ...filters, costMax: e.target.value })}
                    className="text-xs"
                  />
                </div>

                {/* Outcome */}
                <div className="space-y-2">
                  <Label className="text-xs">Outcome</Label>
                  <Select
                    value={filters.outcome}
                    onValueChange={(value) => onFilterChange({ ...filters, outcome: value })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="All Outcomes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Outcomes</SelectItem>
                      <SelectItem value="returned" className="text-xs">Returned to Service</SelectItem>
                      <SelectItem value="retired" className="text-xs">Retired</SelectItem>
                      <SelectItem value="work_order_completed" className="text-xs">Work Order Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Search Bar with Export Button */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by item code, summary, or technician..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
            className="max-w-md"
          />
        </div>
        <Button
          onClick={onExport}
          variant="outline"
          className="gap-2"
          disabled={exportDisabled}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Equipment Filter Modal */}
      <EquipmentFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        products={productTypes}
        selectedProductIds={filters.productType !== "all" ? [filters.productType] : []}
        onApplyFilters={(selectedIds) => {
          onFilterChange({ 
            ...filters, 
            productType: selectedIds.length === 1 ? selectedIds[0] : "all" 
          });
          setFilterModalOpen(false);
        }}
      />
    </div>
  );
};
