import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

interface EnhancedDateNavigatorProps {
  date: Date; // Accept Date objects
  onDateChange: (date: Date) => void; // Return Date objects
  label: string;
}

export const EnhancedDateNavigator: React.FC<EnhancedDateNavigatorProps> = ({
  date,
  onDateChange,
  label
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Work with Date objects throughout
  const currentDate = date;

  const handlePrevious = () => {
    const newDate = subDays(currentDate, 1);
    onDateChange(newDate); // Return Date object
  };

  const handleNext = () => {
    const newDate = addDays(currentDate, 1);
    onDateChange(newDate); // Return Date object
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const newDate = addDays(today, days);
    onDateChange(newDate); // Return Date object
    setIsCalendarOpen(false);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate); // Return Date object
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
            {format(currentDate, 'MMM d, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border shadow-lg z-50" align="center">
          <div className="p-4">
            <Calendar
              mode="single"
              selected={currentDate}
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