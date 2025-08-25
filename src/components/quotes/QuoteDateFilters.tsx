import React from 'react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';

interface QuoteDateFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const QuoteDateFilters: React.FC<QuoteDateFiltersProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  const handleQuickRange = (days: number | 'month' | 'quarter') => {
    const today = new Date();
    
    if (days === 'month') {
      onDateRangeChange({
        from: startOfMonth(today),
        to: endOfMonth(today)
      });
    } else if (days === 'quarter') {
      onDateRangeChange({
        from: startOfQuarter(today),
        to: endOfQuarter(today)
      });
    } else {
      onDateRangeChange({
        from: subDays(today, days),
        to: today
      });
    }
  };

  const clearDateRange = () => {
    onDateRangeChange(undefined);
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Quick Date Range Buttons and Custom Date Picker */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickRange(7)}
          className="text-xs"
        >
          Last 7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickRange(30)}
          className="text-xs"
        >
          Last 30 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickRange('month')}
          className="text-xs"
        >
          This Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickRange('quarter')}
          className="text-xs"
        >
          Last Quarter
        </Button>
        
        {/* Custom Date Range Picker - inline */}
        <DatePickerWithRange
          date={dateRange}
          onDateChange={onDateRangeChange}
          placeholder="Select date range"
          className="w-80"
        />
        
        {dateRange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDateRange}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};