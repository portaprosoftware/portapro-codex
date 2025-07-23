
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

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
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
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
      
      <div className="date-pill bg-gradient-to-r from-[#2F4F9A] to-[#1E3A8A] text-white px-5 py-2 rounded-full font-semibold text-sm shadow-md transition-all duration-200 hover:shadow-lg">
        {format(date, 'MMMM d, yyyy')}
      </div>
      
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
