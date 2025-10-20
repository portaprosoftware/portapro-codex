import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterType = "all" | "in_stock" | "low_stock" | "out_of_stock";

interface MobileStatusFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Products" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

export const MobileStatusFilter: React.FC<MobileStatusFilterProps> = ({
  activeFilter,
  onFilterChange,
  className,
}) => {
  return (
    <div className={cn("md:hidden", className)}>
      <Select value={activeFilter} onValueChange={(value) => onFilterChange(value as FilterType)}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Filter by stock" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Desktop Pill Tabs Component (existing functionality)
interface DesktopStatusTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

export const DesktopStatusTabs: React.FC<DesktopStatusTabsProps> = ({
  activeFilter,
  onFilterChange,
  className,
}) => {
  const getFilterStyle = (filterKey: FilterType) => {
    const isActive = activeFilter === filterKey;
    
    if (isActive) {
      switch (filterKey) {
        case "in_stock":
          return "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 hover:from-green-600 hover:to-green-700";
        case "low_stock":
          return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600 hover:from-yellow-600 hover:to-yellow-700";
        case "out_of_stock":
          return "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 hover:from-red-600 hover:to-red-700";
        default:
          return "bg-blue-600 text-white border-blue-600";
      }
    }
    
    return "border-gray-300 text-gray-700 hover:border-gray-400";
  };

  return (
    <div className={cn("hidden md:flex flex-wrap gap-3", className)}>
      {filterOptions.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
            getFilterStyle(filter.value)
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};
