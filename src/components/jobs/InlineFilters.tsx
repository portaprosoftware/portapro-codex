import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancedDateNavigator } from './EnhancedDateNavigator';

interface InlineFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchKeyDown?: (e: React.KeyboardEvent) => void;
  selectedDriver: string;
  onDriverChange: (value: string) => void;
  selectedJobType: string;
  onJobTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  driversWithJobsToday?: Set<string>;
  // Optional date navigation props
  selectedDate?: Date; // Back to Date objects
  onDateChange?: (date: Date) => void;
  showDateNavigator?: boolean;
}

export const InlineFilters: React.FC<InlineFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onSearchKeyDown,
  selectedDriver,
  onDriverChange,
  selectedJobType,
  onJobTypeChange,
  selectedStatus,
  onStatusChange,
  drivers,
  driversWithJobsToday = new Set(),
  selectedDate,
  onDateChange,
  showDateNavigator = false
}) => {
  return (
    <div className="space-y-3">
      {/* Instructions */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2 border">
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info className="w-3 h-3 hover:text-primary transition-colors" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-sm">
                <p className="text-sm">
                  <strong>Info:</strong> Jobs set before today that aren't completed get a red "Overdue" badge. 
                  After you reschedule an overdue job, the badge turns gold and says "Overdue – Rescheduled". 
                  To mark any job with a priority badge, toggle the Priority switch when viewing or creating a new job.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span>
            <strong>Quick Job Search:</strong> Type a complete Job ID (e.g., DEL-012) and press Enter to find jobs across all dates. 
            Regular search filters current date only.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Enter Job ID (e.g., DEL-012) or Customer name"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              className="pl-10"
            />
          </div>
        </div>

      {/* Driver Filter */}
      <Select value={selectedDriver} onValueChange={onDriverChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Drivers" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          {/* Key directly above driver names */}
          <div className="flex items-center gap-2 text-sm text-gray-600 px-2 py-1 border-b border-gray-100">
            <Check className="w-4 h-4 text-green-500" />
            <span>= Drivers With Jobs Today</span>
          </div>
          <SelectItem value="all">All Drivers</SelectItem>
          {drivers.filter(driver => driver.id && driver.id.trim() !== '').map(driver => (
            <SelectItem key={driver.id} value={driver.id}>
              <div className="flex items-center gap-2">
                {driversWithJobsToday.has(driver.id) && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                <span>{driver.first_name} {driver.last_name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Job Type Filter */}
      <Select value={selectedJobType} onValueChange={onJobTypeChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Job Types" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Job Types</SelectItem>
          <SelectItem value="delivery">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-delivery))]"></div>
              Delivery
            </div>
          </SelectItem>
          <SelectItem value="pickup">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-pickup))]"></div>
              Pickup
            </div>
          </SelectItem>
          <SelectItem value="partial-pickup">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-partial-pickup))]"></div>
              Partial Pickup
            </div>
          </SelectItem>
          <SelectItem value="service">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-service))]"></div>
              Service
            </div>
          </SelectItem>
          <SelectItem value="on-site-survey">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-survey))]"></div>
              On-Site Survey/Estimate
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="assigned">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Assigned
            </div>
          </SelectItem>
          <SelectItem value="unassigned">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              Unassigned
            </div>
          </SelectItem>
          <SelectItem value="in_progress">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
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
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
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

      {/* Date Navigator */}
      {showDateNavigator && selectedDate && onDateChange && (
        <div className="flex items-center gap-2">
          <EnhancedDateNavigator
            date={selectedDate}
            onDateChange={onDateChange}
            label="Date"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Jobs become overdue the day after their scheduled date</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        )}
      </div>
    </div>
  );
};