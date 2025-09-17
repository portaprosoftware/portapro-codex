import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface UniversalJobsHeaderProps {
  selectedDate: Date;
  jobsCount: number;
}

export const UniversalJobsHeader: React.FC<UniversalJobsHeaderProps> = ({
  selectedDate,
  jobsCount
}) => {
  return (
    <div className="p-4 mb-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-gray-600" />
        <span className="font-medium text-gray-900">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </span>
        <span className="text-sm text-gray-600">{jobsCount} jobs scheduled</span>
      </div>
    </div>
  );
};