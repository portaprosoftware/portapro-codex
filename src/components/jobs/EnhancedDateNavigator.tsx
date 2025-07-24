import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { addDaysToDate, subtractDaysFromDate } from '@/lib/dateUtils';

interface EnhancedDateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label: string;
}

export const EnhancedDateNavigator: React.FC<EnhancedDateNavigatorProps> = ({
  date,
  onDateChange,
  label
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePrevious = () => {
    onDateChange(subtractDaysFromDate(date, 1));
  };

  const handleNext = () => {
    onDateChange(addDaysToDate(date, 1));
  };

  const handleQuickSelect = (days: number) => {
    const newDate = addDays(new Date(), days);
    onDateChange(newDate);
    setIsCalendarOpen(false);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        className="date-nav-btn rounded-full w-10 h-10 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-200"
      >
        <ChevronLeft className="w-4 h-4 text-blue-600" />
      </Button>
      
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-white border border-gray-200 text-gray-700 px-5 py-2 rounded-full font-semibold text-sm shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {format(date, 'MMM d, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border shadow-lg z-50" align="center">
          <div className="p-4">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Quick Select</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(0)}
                  className="text-xs"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(1)}
                  className="text-xs"
                >
                  Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(7)}
                  className="text-xs"
                >
                  Next Week
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </div>
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
  );
};