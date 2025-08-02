import React from 'react';
import { FilterChip } from './FilterChip';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { BookmarkPlus, Share2, RotateCcw } from 'lucide-react';

interface FilterChipBarProps {
  dateRange?: DateRange;
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  drivers?: any[];
  onRemoveDateRange?: () => void;
  onRemoveSearchTerm?: () => void;
  onRemoveDriver?: () => void;
  onRemoveJobType?: () => void;
  onRemoveStatus?: () => void;
  onClearAll?: () => void;
  onSavePreset?: () => void;
  onSharePreset?: () => void;
  resultsCount: number;
  totalCount: number;
}

export const FilterChipBar: React.FC<FilterChipBarProps> = ({
  dateRange,
  searchTerm,
  selectedDriver,
  selectedJobType,
  selectedStatus,
  drivers = [],
  onRemoveDateRange,
  onRemoveSearchTerm,
  onRemoveDriver,
  onRemoveJobType,
  onRemoveStatus,
  onClearAll,
  onSavePreset,
  onSharePreset,
  resultsCount,
  totalCount
}) => {
  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : driverId;
  };

  const getJobTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'unassigned': 'Unassigned',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'priority': 'Priority',
      'was_overdue': 'Overdue - Rescheduled',
      'overdue': 'Overdue',
      'completed_late': 'Completed Late'
    };
    return labels[status] || status;
  };

  const formatDateRange = (range: DateRange) => {
    if (range.from && range.to) {
      if (range.from.toDateString() === range.to.toDateString()) {
        return format(range.from, 'MMM d, yyyy');
      }
      return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`;
    }
    if (range.from) {
      return `From ${format(range.from, 'MMM d, yyyy')}`;
    }
    if (range.to) {
      return `Until ${format(range.to, 'MMM d, yyyy')}`;
    }
    return '';
  };

  const hasActiveFilters = dateRange || 
    (searchTerm && searchTerm.trim() !== '') || 
    (selectedDriver && selectedDriver !== 'all') || 
    (selectedJobType && selectedJobType !== 'all') || 
    (selectedStatus && selectedStatus !== 'all');

  if (!hasActiveFilters) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-foreground">
            {totalCount} Total Jobs
          </span>
          <span className="text-sm text-muted-foreground">
            All jobs across all dates
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {dateRange && (
          <FilterChip
            label="Date Range"
            value={formatDateRange(dateRange)}
            onRemove={onRemoveDateRange || (() => {})}
          />
        )}
        
        {searchTerm && searchTerm.trim() !== '' && (
          <FilterChip
            label="Search"
            value={searchTerm}
            onRemove={onRemoveSearchTerm || (() => {})}
          />
        )}
        
        {selectedDriver && selectedDriver !== 'all' && (
          <FilterChip
            label="Driver"
            value={getDriverName(selectedDriver)}
            onRemove={onRemoveDriver || (() => {})}
          />
        )}
        
        {selectedJobType && selectedJobType !== 'all' && (
          <FilterChip
            label="Job Type"
            value={getJobTypeLabel(selectedJobType)}
            onRemove={onRemoveJobType || (() => {})}
          />
        )}
        
        {selectedStatus && selectedStatus !== 'all' && (
          <FilterChip
            label="Status"
            value={getStatusLabel(selectedStatus)}
            onRemove={onRemoveStatus || (() => {})}
          />
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Results Summary and Actions */}
      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-foreground">
            {resultsCount} Jobs Found
          </span>
          
          {dateRange && (
            <span className="text-sm text-muted-foreground">
              {formatDateRange(dateRange)}
            </span>
          )}
          
          {resultsCount !== totalCount && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {totalCount - resultsCount} filtered out
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSavePreset}
            className="h-8"
          >
            <BookmarkPlus className="h-3 w-3 mr-1" />
            Save Preset
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSharePreset}
            className="h-8"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};