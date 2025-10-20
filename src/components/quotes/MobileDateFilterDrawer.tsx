import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDateFilterDrawerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  activeFilter?: string;
  onActiveFilterChange?: (filter: string) => void;
}

export function MobileDateFilterDrawer({
  dateRange,
  onDateRangeChange,
  activeFilter,
  onActiveFilterChange,
}: MobileDateFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange);
  const [selectedMode, setSelectedMode] = useState<'quick' | 'custom'>('quick');

  const quickFilters = [
    {
      id: 'last7days',
      label: 'Last 7 Days',
      getRange: () => ({
        from: startOfDay(subDays(new Date(), 7)),
        to: endOfDay(new Date())
      })
    },
    {
      id: 'last30days',
      label: 'Last 30 Days',
      getRange: () => ({
        from: startOfDay(subDays(new Date(), 30)),
        to: endOfDay(new Date())
      })
    },
    {
      id: 'thismonth',
      label: 'This Month',
      getRange: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      id: 'lastquarter',
      label: 'Last Quarter',
      getRange: () => ({
        from: startOfQuarter(subDays(new Date(), 90)),
        to: endOfQuarter(subDays(new Date(), 90))
      })
    },
    {
      id: 'all',
      label: 'All Time',
      getRange: () => undefined
    }
  ];

  const handleQuickFilterClick = (filter: typeof quickFilters[0]) => {
    const range = filter.getRange();
    setTempDateRange(range);
    onDateRangeChange(range);
    onActiveFilterChange?.(filter.id);
    setSelectedMode('quick');
    setOpen(false);
  };

  const handleCustomDateApply = () => {
    onDateRangeChange(tempDateRange);
    onActiveFilterChange?.('custom');
    setSelectedMode('custom');
    setOpen(false);
  };

  const handleClearFilters = () => {
    setTempDateRange(undefined);
    onDateRangeChange(undefined);
    onActiveFilterChange?.('all');
    setSelectedMode('quick');
  };

  const getButtonLabel = () => {
    if (!dateRange || activeFilter === 'all') {
      return 'All Time';
    }
    if (activeFilter === 'custom' && dateRange) {
      return `${format(dateRange.from!, 'MMM d')} - ${dateRange.to ? format(dateRange.to, 'MMM d') : ''}`;
    }
    return quickFilters.find(f => f.id === activeFilter)?.label || 'Filter Dates';
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between min-h-[48px] text-base font-medium"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span>{getButtonLabel()}</span>
          </div>
          {dateRange && activeFilter !== 'all' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearFilters();
              }}
              className="ml-2 rounded-full hover:bg-muted p-1 transition-colors"
              aria-label="Clear date filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[75vh]">
        <DrawerHeader>
          <DrawerTitle>Filter by Date</DrawerTitle>
          <DrawerDescription>
            Choose a quick filter or select a custom date range
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto flex-1">
          {/* Quick Filters */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Quick Filters
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id && selectedMode === 'quick' ? "default" : "outline"}
                  onClick={() => handleQuickFilterClick(filter)}
                  className={cn(
                    "min-h-[48px] justify-start font-medium",
                    activeFilter === filter.id && selectedMode === 'quick' 
                      ? 'bg-gradient-primary text-white' 
                      : ''
                  )}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Custom Date Range
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <Calendar
                mode="range"
                selected={tempDateRange}
                onSelect={setTempDateRange}
                numberOfMonths={1}
                className="pointer-events-auto"
              />
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 min-h-[48px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomDateApply}
              disabled={!tempDateRange?.from}
              className="flex-1 min-h-[48px] bg-gradient-primary text-white"
            >
              Apply Custom Range
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
