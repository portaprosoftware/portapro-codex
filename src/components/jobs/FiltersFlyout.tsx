
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FiltersFlyoutProps {
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

export const FiltersFlyout: React.FC<FiltersFlyoutProps> = ({
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
  const [isOpen, setIsOpen] = useState(false);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedDriver !== 'all') count++;
    if (selectedJobType !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onDriverChange('all');
    onJobTypeChange('all');
    onStatusChange('all');
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-blue-500 text-white text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-white border shadow-lg" align="end">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Filter Jobs</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Jobs
              </label>
              <input
                type="text"
                placeholder="Search by job number or customer..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => onDriverChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Drivers</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => onJobTypeChange('all')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedJobType === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  All Job Types
                </button>
                <button
                  onClick={() => onJobTypeChange('delivery')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedJobType === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => onJobTypeChange('pickup')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedJobType === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  Pickup
                </button>
                <button
                  onClick={() => onJobTypeChange('service')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedJobType === 'service' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  Service
                </button>
                <button
                  onClick={() => onJobTypeChange('return')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedJobType === 'return' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  Partial Pickup
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => onStatusChange('all')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedStatus === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  All Statuses
                </button>
                <button
                  onClick={() => onStatusChange('unassigned')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedStatus === 'unassigned' ? 'border-gray-400 bg-gray-50' : 'border-gray-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  Unassigned
                </button>
                <button
                  onClick={() => onStatusChange('assigned')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedStatus === 'assigned' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Assigned
                </button>
                <button
                  onClick={() => onStatusChange('in_progress')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedStatus === 'in_progress' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  In Progress
                </button>
                <button
                  onClick={() => onStatusChange('completed')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedStatus === 'completed' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Completed
                </button>
                <button
                  onClick={() => onStatusChange('cancelled')}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 ${
                    selectedStatus === 'cancelled' ? 'border-gray-500 bg-gray-50' : 'border-gray-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  Cancelled
                </button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
