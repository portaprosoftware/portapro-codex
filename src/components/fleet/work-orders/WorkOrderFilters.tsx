import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Filter, Download, UserPlus, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAssetType: string;
  onAssetTypeChange: (value: string) => void;
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
  selectedSource: string;
  onSourceChange: (value: string) => void;
  selectedAssignee: string;
  onAssigneeChange: (value: string) => void;
  overdueOnly: boolean;
  onOverdueToggle: (value: boolean) => void;
  oosOnly: boolean;
  onOosToggle: (value: boolean) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  onBulkAssign: () => void;
  onExport: () => void;
}

export const WorkOrderFilters: React.FC<WorkOrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedAssetType,
  onAssetTypeChange,
  selectedPriority,
  onPriorityChange,
  selectedSource,
  onSourceChange,
  selectedAssignee,
  onAssigneeChange,
  overdueOnly,
  onOverdueToggle,
  oosOnly,
  onOosToggle,
  activeFiltersCount,
  onClearFilters,
  onBulkAssign,
  onExport
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
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={onBulkAssign}>
            <UserPlus className="h-4 w-4 mr-2" />
            Bulk Assign
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedAssetType} onValueChange={onAssetTypeChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Asset Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            <SelectItem value="vehicle">Vehicles</SelectItem>
            <SelectItem value="trailer">Trailers</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPriority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSource} onValueChange={onSourceChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="dvir_defect">DVIR Defect</SelectItem>
            <SelectItem value="pm_schedule">PM Schedule</SelectItem>
            <SelectItem value="breakdown">Breakdown</SelectItem>
            <SelectItem value="recall">Recall</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedAssignee} onValueChange={onAssigneeChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {/* Add dynamic assignee options here */}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="overdue-filter"
            checked={overdueOnly}
            onCheckedChange={onOverdueToggle}
          />
          <Label htmlFor="overdue-filter" className="text-sm">Overdue only</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="oos-filter"
            checked={oosOnly}
            onCheckedChange={onOosToggle}
          />
          <Label htmlFor="oos-filter" className="text-sm">Out of service</Label>
        </div>
      </div>
    </div>
  );
};