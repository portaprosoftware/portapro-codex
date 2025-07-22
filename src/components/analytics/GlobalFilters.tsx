
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
  const quickRanges = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'This Month', days: 30 },
    { label: 'Last Quarter', days: 90 }
  ];

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateRangeChange({ from: start, to: end });
  };

  return (
    <Card className="p-4 mb-6 bg-gray-50 border border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side - Date picker and quick ranges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickRange(range.days)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="text-xs">
              Custom
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Right side - Saved filters and reset */}
        <div className="flex items-center gap-3">
          {savedFilters.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {savedFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="secondary"
                      className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {filter}
                      <button
                        onClick={() => onRemoveFilter(filter)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetAll}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Reset All
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
