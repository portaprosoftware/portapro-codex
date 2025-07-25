import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { JobStatus } from '@/types';

interface MultiStatusFilterProps {
  selectedStatuses: (JobStatus | 'all')[];
  onChange: (statuses: (JobStatus | 'all')[]) => void;
}

const statusOptions = [
  { value: 'all' as const, label: 'All' },
  { value: 'unassigned' as const, label: 'Unassigned' },
  { value: 'assigned' as const, label: 'Assigned' },
  { value: 'in-progress' as const, label: 'In Progress' },
  { value: 'completed' as const, label: 'Completed' },
  { value: 'cancelled' as const, label: 'Cancelled' }
];

export const MultiStatusFilter: React.FC<MultiStatusFilterProps> = ({
  selectedStatuses,
  onChange
}) => {
  const [open, setOpen] = useState(false);

  const handleStatusToggle = (status: JobStatus | 'all') => {
    if (status === 'all') {
      // If 'all' is selected, clear all other selections
      onChange(['all']);
    } else {
      let newStatuses = [...selectedStatuses];
      
      // Remove 'all' if it exists when selecting specific statuses
      newStatuses = newStatuses.filter(s => s !== 'all');
      
      if (newStatuses.includes(status)) {
        // Remove if already selected
        newStatuses = newStatuses.filter(s => s !== status);
        // If no statuses left, default to 'all'
        if (newStatuses.length === 0) {
          newStatuses = ['all'];
        }
      } else {
        // Add status
        newStatuses.push(status);
      }
      
      onChange(newStatuses);
    }
  };

  const getDisplayText = () => {
    if (selectedStatuses.includes('all') || selectedStatuses.length === 0) {
      return 'All Statuses';
    }
    if (selectedStatuses.length === 1) {
      const status = statusOptions.find(s => s.value === selectedStatuses[0]);
      return status?.label || 'Status';
    }
    return `${selectedStatuses.length} Statuses`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          size="sm"
        >
          {getDisplayText()}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="max-h-60 overflow-auto">
          {statusOptions.map((option) => {
            const isSelected = selectedStatuses.includes(option.value);
            return (
              <div
                key={option.value}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-muted cursor-pointer"
                onClick={() => handleStatusToggle(option.value)}
              >
                <div className="flex items-center justify-center w-4 h-4 border border-input rounded">
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <span className="text-sm">{option.label}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};