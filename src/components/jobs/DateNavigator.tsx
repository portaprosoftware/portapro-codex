
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { addDays, subtractDays } from '@/lib/dateUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label: string;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  date,
  onDateChange,
  label
}) => {
  const handlePrevious = () => {
    onDateChange(subtractDays(date, 1));
  };

  const handleNext = () => {
    onDateChange(addDays(date, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleTomorrow = () => {
    onDateChange(addDays(new Date(), 1));
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Quick Actions */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToday}
          className="text-xs px-2 py-1 h-7"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTomorrow}
          className="text-xs px-2 py-1 h-7"
        >
          Tomorrow
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          className="date-nav-btn rounded-full w-10 h-10 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 text-blue-600" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="date-pill bg-gradient-to-r from-[#2F4F9A] to-[#1E3A8A] text-white px-5 py-2 rounded-full font-semibold text-sm shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {format(date, 'MMMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && onDateChange(newDate)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="date-nav-btn rounded-full w-10 h-10 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4 text-blue-600" />
        </Button>
      </div>
    </div>
  );
};
