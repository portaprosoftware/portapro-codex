import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { FilterToggle } from './FilterToggle';

interface UniversalJobsHeaderProps {
  selectedDate: Date;
  jobsCount: number;
  showCancelled: boolean;
  onToggleCancelled: (show: boolean) => void;
  cancelledCount?: number;
}

export const UniversalJobsHeader: React.FC<UniversalJobsHeaderProps> = ({
  selectedDate,
  jobsCount,
  showCancelled,
  onToggleCancelled,
  cancelledCount = 0
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </span>
          <span className="text-sm text-gray-600">{jobsCount} jobs scheduled</span>
        </div>
        <FilterToggle
          showCancelled={showCancelled}
          onToggle={onToggleCancelled}
          cancelledCount={cancelledCount}
        />
      </div>
    </div>
  );
};