import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, ArrowUp, ArrowDown, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAssetType: string;
  onAssetTypeChange: (value: string) => void;
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedSource: string;
  onSourceChange: (value: string) => void;
  selectedAssignee: string;
  onAssigneeChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  sortBy: 'created_at' | 'due_date' | 'priority';
  onSortByChange: (value: 'created_at' | 'due_date' | 'priority') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  hideAssetTypeFilter?: boolean;
  // Vehicle filter
  selectedVehicleCount?: number;
  onOpenVehicleFilter?: () => void;
}

export const WorkOrderFilters: React.FC<WorkOrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedAssetType,
  onAssetTypeChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  selectedSource,
  onSourceChange,
  selectedAssignee,
  onAssigneeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  activeFiltersCount,
  onClearFilters,
  hideAssetTypeFilter = false,
  selectedVehicleCount = 0,
  onOpenVehicleFilter
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search work orders..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="px-2">
              {activeFiltersCount} filters
            </Badge>
          )}
          {onOpenVehicleFilter && (
            <Button variant="outline" size="sm" onClick={onOpenVehicleFilter} className="gap-1">
              <Truck className="h-4 w-4" />
              {selectedVehicleCount === 0 ? 'All Vehicles' : `${selectedVehicleCount} selected`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {/* Filter Row 1 */}
      <div className={hideAssetTypeFilter ? "grid grid-cols-3 gap-3" : "grid grid-cols-4 gap-3"}>
        {!hideAssetTypeFilter && (
          <Select value={selectedAssetType} onValueChange={onAssetTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50" sideOffset={4}>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="vehicle">Vehicles</SelectItem>
              <SelectItem value="trailer">Trailers</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={selectedPriority} onValueChange={onPriorityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50" sideOffset={4}>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50" sideOffset={4}>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="ready_for_verification">Ready For Verification</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSource} onValueChange={onSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50" sideOffset={4}>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="dvir_defect">DVIR Defect</SelectItem>
            <SelectItem value="pm_schedule">PM Schedule</SelectItem>
            <SelectItem value="breakdown">Breakdown</SelectItem>
            <SelectItem value="recall">Recall</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Row 2: Date Range, Assignee, and Sorting */}
      <div className="grid grid-cols-5 gap-3">
        <div>
          <Label htmlFor="start-date" className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="end-date" className="text-xs text-muted-foreground mb-1 block">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Assignee</Label>
          <Select value={selectedAssignee} onValueChange={onAssigneeChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50" sideOffset={4}>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {/* Add dynamic assignee options here */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Sort By</Label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50" sideOffset={4}>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Order</Label>
          <Button
            variant="outline"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full h-9"
          >
            {sortOrder === 'asc' ? (
              <>
                <ArrowUp className="h-4 w-4 mr-2" />
                Ascending
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 mr-2" />
                Descending
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  );
};