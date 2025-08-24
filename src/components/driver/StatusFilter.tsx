
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JobStatus } from '@/types';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';
import { Filter, ChevronDown } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface StatusFilterProps {
  value: JobStatus | 'all' | 'priority' | 'was_overdue' | 'overdue' | 'completed_late';
  onChange: (status: JobStatus | 'all' | 'priority' | 'was_overdue' | 'overdue' | 'completed_late') => void;
}

const statusOptions = [
  { value: 'all' as const, label: 'All Statuses', count: 0 },
  { value: 'assigned' as const, label: 'Assigned', count: 0 },
  { value: 'unassigned' as const, label: 'Unassigned', count: 0 },
  { value: 'in-progress' as const, label: 'In Progress', count: 0 },
  { value: 'completed' as const, label: 'Completed', count: 0 },
  { value: 'cancelled' as const, label: 'Cancelled', count: 0 },
  { value: 'priority' as const, label: 'Priority', count: 0 },
  { value: 'was_overdue' as const, label: 'Overdue - Rescheduled', count: 0 },
  { value: 'overdue' as const, label: 'Overdue', count: 0 },
  { value: 'completed_late' as const, label: 'Job Completed Late', count: 0 }
];

export const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  
  const currentStatusLabel = statusOptions.find(option => option.value === value)?.label || 'All Statuses';

  const handleStatusSelect = (status: typeof value) => {
    onChange(status);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>{currentStatusLabel}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="h-[75vh]">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Filter by Status</DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 pb-8 space-y-3 overflow-y-auto max-h-[60vh]">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  value === option.value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
