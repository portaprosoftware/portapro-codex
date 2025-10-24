
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, Filter, X, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isPeriodComparisonOpen, setIsPeriodComparisonOpen] = useState(true);
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

  // Calculate period information for clarity
  const periodLength = differenceInDays(dateRange.to, dateRange.from);
  const currentPeriodText = `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  const previousPeriodStart = new Date(dateRange.from);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - periodLength);
  const previousPeriodEnd = new Date(dateRange.to);
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodLength);
  const previousPeriodText = `${format(previousPeriodStart, 'MMM d')} - ${format(previousPeriodEnd, 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      {/* Desktop Date Range */}
      <div className="hidden lg:block p-4 bg-gray-50 border border-gray-200 rounded-xl">
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
                  className="text-xs min-h-[36px]"
                >
                  {range.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="text-xs min-h-[36px]">
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
        
        {/* Period Comparison Info - Collapsible */}
        <Collapsible open={isPeriodComparisonOpen} onOpenChange={setIsPeriodComparisonOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="font-medium text-gray-900 text-sm">Period Comparison</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">expand / collapse</span>
                <ChevronDown className={cn("w-4 h-4 text-gray-600 transition-transform", isPeriodComparisonOpen && "rotate-180")} />
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-sm">
                <div className="text-gray-700 space-y-1">
                  <p><span className="font-medium">Current Period:</span> {currentPeriodText} ({periodLength + 1} days)</p>
                  <p><span className="font-medium">Previous Period:</span> {previousPeriodText} ({periodLength + 1} days)</p>
                  <p className="text-gray-600 text-xs mt-2">
                    Percentage changes in metrics compare the current period to the previous period of equal length.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Mobile/Tablet Date Range - Collapsible */}
      <div className="lg:hidden p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between min-h-[44px] p-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
                <span className="text-sm text-gray-600">{format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Quick Ranges */}
            <div className="grid grid-cols-2 gap-2">
              {quickRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(range.days)}
                  className="text-xs min-h-[44px]"
                >
                  {range.label}
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm" className="w-full text-xs min-h-[44px]">
              Custom
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {/* Period Comparison Info - Collapsible */}
            <Collapsible open={isPeriodComparisonOpen} onOpenChange={setIsPeriodComparisonOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-xs">Period Comparison</span>
                  </div>
                  <ChevronDown className={cn("w-3 h-3 text-gray-600 transition-transform", isPeriodComparisonOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="text-xs">
                    <div className="text-gray-700 space-y-1">
                      <p><span className="font-medium">Current:</span> {currentPeriodText} ({periodLength + 1}d)</p>
                      <p><span className="font-medium">Previous:</span> {previousPeriodText} ({periodLength + 1}d)</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Active Filters - Always visible if filters exist */}
      {savedFilters.length > 0 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {savedFilters.map((filter) => (
                  <Badge
                    key={filter}
                    variant="secondary"
                    className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 flex-shrink-0"
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
              className="text-gray-500 hover:text-gray-700 text-xs flex-shrink-0"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
