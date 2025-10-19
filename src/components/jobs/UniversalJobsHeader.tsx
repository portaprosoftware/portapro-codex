import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UniversalJobsHeaderProps {
  selectedDate: Date;
  jobsCount: number;
}

export const UniversalJobsHeader: React.FC<UniversalJobsHeaderProps> = ({
  selectedDate,
  jobsCount
}) => {
  return (
    <div className="py-3 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Date and Jobs Badge - Stacked on mobile, single row on desktop */}
        <div className="flex items-center justify-between md:justify-start">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-600" />
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                <span className="font-medium text-gray-900 text-sm md:text-base">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
                <Badge variant="secondary" className="text-xs w-fit">
                  {jobsCount} jobs scheduled
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Info button - visible on mobile */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 md:hidden">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Quick Tips
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Jobs become overdue the day after their scheduled date.
                </p>
                <p className="text-sm text-gray-600">
                  To mark any job as a priority, toggle the Priority switch when creating or viewing a job.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Quick Job Search - Own row on mobile, inline on desktop */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5 border flex-1 md:flex-none">
            <span>
              <strong>Quick Job Search:</strong> Type job ID to search today; select enter to filter matches for any date.
            </span>
          </div>
          
          {/* Info button - visible on desktop */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hidden md:flex">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Quick Tips
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Jobs become overdue the day after their scheduled date.
                </p>
                <p className="text-sm text-gray-600">
                  To mark any job as a priority, toggle the Priority switch when creating or viewing a job.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};