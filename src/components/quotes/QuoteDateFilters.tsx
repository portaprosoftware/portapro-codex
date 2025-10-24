import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="bg-white rounded-lg border">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">Filter by Date</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t p-4">
          {/* Date Range Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Left side: Select date range */}
            <div className="flex items-center gap-2">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={onDateRangeChange}
                placeholder="Select date range"
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

            {/* Right side: Quick filter buttons */}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};