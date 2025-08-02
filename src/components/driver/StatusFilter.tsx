
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { JobStatus } from '@/types';

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
  return (
    <div className="flex space-x-2 overflow-x-auto pb-1">
      {statusOptions.map((option) => (
        <Badge
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          className="cursor-pointer whitespace-nowrap"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Badge>
      ))}
    </div>
  );
};
