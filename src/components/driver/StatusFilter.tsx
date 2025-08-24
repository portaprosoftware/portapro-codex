
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JobStatus } from '@/types';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';
import { Filter, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
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
  const isMobile = useIsMobile();
  
  const currentStatusLabel = statusOptions.find(option => option.value === value)?.label || 'All Statuses';

  // Debug logging to verify component state
  useEffect(() => {
    console.log('StatusFilter rendered - isMobile:', isMobile, 'value:', value);
  }, [isMobile, value]);

  const handleStatusSelect = (status: typeof value) => {
    onChange(status);
    setOpen(false);
  };

  return (
    <Drawer 
      key={`status-filter-${value}-${isMobile}`}
      open={open} 
      onOpenChange={setOpen}
      shouldScaleBackground={false}
    >
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between bg-background border-border hover:bg-muted/50 focus:ring-2 focus:ring-primary/20"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{currentStatusLabel}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="h-[75vh] fixed inset-x-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-[10px] border bg-background">
        <div className="mx-auto w-full max-w-md flex flex-col h-full">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-lg font-semibold">Filter by Status</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Select a status to filter your jobs
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 px-4 pb-8 space-y-3 overflow-y-auto">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                  value === option.value 
                    ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                    : 'border-border hover:bg-muted/50 hover:border-muted-foreground/50'
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
