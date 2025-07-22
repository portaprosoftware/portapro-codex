
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface GlobalFiltersProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  savedFilters: string[];
  onRemoveFilter: (filter: string) => void;
  onResetAll: () => void;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  savedFilters,
  onRemoveFilter,
  onResetAll
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<any>({ from: dateRange.from, to: dateRange.to });

  const quickRanges = [
    {
      label: 'Last 7 Days',
      getValue: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    },
    {
      label: 'Last 30 Days',
      getValue: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    },
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date()
        };
      }
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: lastMonth,
          to: endOfLastMonth
        };
      }
    }
  ];

  const handleQuickRange = (range: { from: Date; to: Date }) => {
    onDateRangeChange(range);
    setSelectedRange(range);
    setIsDatePickerOpen(false);
  };

  const handleDateSelect = (range: any) => {
    setSelectedRange(range);
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
      setIsDatePickerOpen(false);
    }
  };

  return (
    <Card className="mx-6 mt-6 p-4 bg-gray-50/50 border border-gray-200 shadow-inner">
      <div className="flex items-center justify-between">
        {/* Left side - Date picker and quick ranges */}
        <div className="flex items-center space-x-4">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-64 justify-start text-left font-normal bg-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="p-3 border-r">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Quick Ranges</h4>
                    {quickRanges.map((range) => (
                      <Button
                        key={range.label}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => handleQuickRange(range.getValue())}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={selectedRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  className="p-3"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right side - Saved filters and reset */}
        <div className="flex items-center space-x-3">
          {savedFilters.length > 0 && (
            <>
              <div className="flex items-center space-x-2">
                {savedFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {filter}
                    <button
                      onClick={() => onRemoveFilter(filter)}
                      className="ml-1 hover:bg-blue-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <button
                onClick={onResetAll}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Reset All
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
