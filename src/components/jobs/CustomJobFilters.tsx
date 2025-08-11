import React from 'react';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CustomJobFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedDriver: string;
  onDriverChange: (driver: string) => void;
  selectedJobType: string;
  onJobTypeChange: (type: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  drivers: any[];
  onExport: () => void;
  resultsCount: number;
}

export const CustomJobFilters: React.FC<CustomJobFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  searchTerm,
  onSearchTermChange,
  selectedDriver,
  onDriverChange,
  selectedJobType,
  onJobTypeChange,
  selectedStatus,
  onStatusChange,
  drivers,
  onExport,
  resultsCount
}) => {
  const quickRanges = [
    {
      label: 'Last 7 Days',
      range: { from: subDays(new Date(), 7), to: new Date() }
    },
    {
      label: 'Last 30 Days',
      range: { from: subDays(new Date(), 30), to: new Date() }
    },
    {
      label: 'Month to Date',
      range: { from: startOfMonth(new Date()), to: new Date() }
    },
    {
      label: 'Last Quarter',
      range: { from: startOfQuarter(subDays(startOfQuarter(new Date()), 1)), to: subDays(startOfQuarter(new Date()), 1) }
    },
    {
      label: 'Quarter to Date',
      range: { from: startOfQuarter(new Date()), to: new Date() }
    },
    {
      label: 'Year to Date',
      range: { from: startOfYear(new Date()), to: new Date() }
    }
  ];

  return (
    <Card className="p-6 space-y-6">
      {/* Quick Range Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Date Ranges</h3>
        <div className="flex flex-wrap gap-2">
          {quickRanges.map((quickRange) => (
            <Button
              key={quickRange.label}
              variant="outline"
              size="sm"
              onClick={() => onDateRangeChange(quickRange.range)}
              className="text-xs"
            >
              {quickRange.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Custom Date Range</h3>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={onDateRangeChange}
          placeholder="Select custom date range"
          className="w-full"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Job ID Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Job ID (e.g., DEL-012)..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Driver Filter */}
        <Select value={selectedDriver} onValueChange={onDriverChange}>
          <SelectTrigger>
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
          <SelectTrigger>
            <SelectValue placeholder="All Job Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Types</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="return">Return</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="partial-pickup">Partial Pickup</SelectItem>
            <SelectItem value="on-site-survey">Survey/Estimate</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unassigned">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                Unassigned
              </div>
            </SelectItem>
            <SelectItem value="assigned">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Assigned
              </div>
            </SelectItem>
            <SelectItem value="in_progress">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                In Progress
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Completed
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Cancelled
              </div>
            </SelectItem>
            <SelectItem value="priority">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Priority
              </div>
            </SelectItem>
            <SelectItem value="was_overdue">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                Overdue - Rescheduled
              </div>
            </SelectItem>
            <SelectItem value="overdue">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Overdue
              </div>
            </SelectItem>
            <SelectItem value="completed_late">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                Job Completed Late
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        <Button
          onClick={onExport}
          variant="outline"
          className="flex items-center gap-2"
          disabled={resultsCount === 0}
        >
          <Download className="h-4 w-4" />
          Export ({resultsCount})
        </Button>
      </div>
    </Card>
  );
};