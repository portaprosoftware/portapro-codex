import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CalendarIcon, Search, Info } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DispatchFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  jobsCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDriver: string;
  onDriverChange: (driver: string) => void;
  selectedJobType: string;
  onJobTypeChange: (jobType: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  drivers: any[];
  onQuickFilter: (filter: string) => void;
  activeFilters: string[];
}

export const DispatchFilters: React.FC<DispatchFiltersProps> = ({
  selectedDate,
  onDateChange,
  jobsCount,
  searchQuery,
  onSearchChange,
  selectedDriver,
  onDriverChange,
  selectedJobType,
  onJobTypeChange,
  selectedStatus,
  onStatusChange,
  drivers,
  onQuickFilter,
  activeFilters
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePrevious = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNext = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsCalendarOpen(false);
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleTomorrow = () => {
    onDateChange(addDays(new Date(), 1));
  };

  const quickFilters = [
    { label: 'Today', action: 'today' },
    { label: 'Tomorrow', action: 'tomorrow' },
    { label: 'Product Availability', action: 'product-availability' },
    { label: 'Route vs Truck Stock', action: 'route-vs-stock' },
    { label: 'Cancelled Jobs', action: 'cancelled' },
  ];

  return (
    <div className="bg-background border-b p-4 space-y-4">
      {/* Top Row - Date Navigation and Jobs Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="rounded-full w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-muted"
                >
                  <CalendarIcon className="w-4 h-4" />
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="rounded-full w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Jobs Count Badge */}
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {jobsCount} jobs scheduled
          </Badge>
        </div>

        {/* Quick Job Search Hint */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>Quick Job Search: Type job ID to search today; select enter to filter matches for any date.</span>
          <Info className="w-4 h-4" />
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter Job ID (e.g., 2032) or Customer name"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Driver Filter */}
        <Select value={selectedDriver} onValueChange={onDriverChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.first_name} {driver.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Job Type Filter */}
        <Select value={selectedJobType} onValueChange={onJobTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Job Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Types</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Filter Buttons Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {quickFilters.map((filter) => (
          <Button
            key={filter.action}
            variant={activeFilters.includes(filter.action) ? "default" : "outline"}
            size="sm"
            onClick={() => onQuickFilter(filter.action)}
            className={cn(
              "text-xs px-3 py-1 h-8",
              activeFilters.includes(filter.action) && "bg-primary text-primary-foreground"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};