
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { JobStatus } from '@/types';

interface StatusFilterProps {
  value: JobStatus | 'all';
  onChange: (status: JobStatus | 'all') => void;
}

const statusOptions = [
  { value: 'all' as const, label: 'All', count: 0 },
  { value: 'assigned' as const, label: 'Assigned', count: 0 },
  { value: 'unassigned' as const, label: 'Unassigned', count: 0 },
  { value: 'in-progress' as const, label: 'In Progress', count: 0 },
  { value: 'completed' as const, label: 'Completed', count: 0 }
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
