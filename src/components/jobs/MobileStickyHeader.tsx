import React from 'react';
import { format } from 'date-fns';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileStickyHeaderProps {
  selectedDate: Date;
  jobsCount: number;
  onAddJob: () => void;
}

export const MobileStickyHeader: React.FC<MobileStickyHeaderProps> = ({
  selectedDate,
  jobsCount,
  onAddJob
}) => {
  return (
    <div className="md:hidden sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {format(selectedDate, 'MMM d, yyyy')}
          </span>
          <Badge variant="secondary" className="text-xs">
            {jobsCount} {jobsCount === 1 ? 'job' : 'jobs'}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={onAddJob}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
};
