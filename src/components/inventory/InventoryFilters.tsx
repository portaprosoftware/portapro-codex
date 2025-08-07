import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

type FilterType = "all" | "in_stock" | "low_stock" | "out_of_stock" | "available_now";

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedLocationId,
  onLocationChange,
  selectedFilter,
  onFilterChange,
}) => {
  return (
    <Card className="p-6 space-y-6">
      {/* Quick Item Search */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Quick Item Search: Type a complete Item Code (e.g., PT-001) and press Enter to find items across all dates. Regular search filters current items only.
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Item Code or Product name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Filter */}
        <Select value={selectedLocationId} onValueChange={onLocationChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="yard">Yard</SelectItem>
            <SelectItem value="field">Field</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedFilter} onValueChange={onFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            <SelectItem value="available_now">Available Now</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};