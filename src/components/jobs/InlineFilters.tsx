import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check } from 'lucide-react';

interface InlineFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDriver: string;
  onDriverChange: (value: string) => void;
  selectedJobType: string;
  onJobTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  driversWithJobsToday?: Set<string>;
}

export const InlineFilters: React.FC<InlineFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedDriver,
  onDriverChange,
  selectedJobType,
  onJobTypeChange,
  selectedStatus,
  onStatusChange,
  drivers,
  driversWithJobsToday = new Set()
}) => {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Search Input */}
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Enter Job ID or Customer"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
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
        </SelectContent>
      </Select>
    </div>
  );
};