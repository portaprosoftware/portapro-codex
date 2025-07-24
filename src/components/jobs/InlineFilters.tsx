import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

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
  drivers
}) => {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by job number or customer..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Driver Filter */}
      <Select value={selectedDriver} onValueChange={onDriverChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Drivers" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Drivers</SelectItem>
          {drivers.filter(driver => driver.id && driver.id.trim() !== '').map(driver => (
            <SelectItem key={driver.id} value={driver.id}>
              {driver.first_name} {driver.last_name}
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
          <SelectItem value="delivery">Delivery</SelectItem>
          <SelectItem value="pickup">Pickup</SelectItem>
          <SelectItem value="service">Service</SelectItem>
          <SelectItem value="return">Return</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};