
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check, Info, X, ChevronDown, ChevronUp, Calendar, Truck, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EnhancedDateNavigator } from './EnhancedDateNavigator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvailabilityTrackerSheet } from '@/components/inventory/AvailabilityTrackerSheet';
import { StockVehicleSelectionModal } from '@/components/fleet/StockVehicleSelectionModal';
import { UniversalJobsHeader } from './UniversalJobsHeader';
import { FilterToggle } from './FilterToggle';
import { MultiSelectDriverFilter } from '@/components/fleet/MultiSelectDriverFilter';
import { MobileFilterPanel } from './MobileFilterPanel';

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
  // Universal header props
  showUniversalHeader?: boolean;
  jobsCount?: number;
  showCancelled?: boolean;
  onToggleCancelled?: (show: boolean) => void;
  cancelledCount?: number;
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
  showDateNavigator = false,
  showUniversalHeader = false,
  jobsCount = 0,
  showCancelled = false,
  onToggleCancelled,
  cancelledCount = 0
}) => {
  const [showRouteStock, setShowRouteStock] = useState(false);
  const [stockVehicleId, setStockVehicleId] = useState<string>('');
  const [stockServiceDate, setStockServiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [showAvailabilityTracker, setShowAvailabilityTracker] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Convert drivers array to match MultiSelectDriverFilter format
  const selectedDriversForModal = selectedDriver === 'all' 
    ? [] 
    : drivers.filter(d => d.id === selectedDriver).map(d => ({
        id: d.id,
        first_name: d.first_name,
        last_name: d.last_name,
        email: null,
        clerk_user_id: null
      }));

  // Calculate active filters count for mobile
  const activeFiltersCount = [
    searchTerm !== '',
    selectedDriver !== 'all',
    selectedJobType !== 'all',
    selectedStatus !== 'all'
  ].filter(Boolean).length;

  // Route vs Truck Stock queries
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model, year, vehicle_image, vehicle_type')
        .order('license_plate');
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        license_plate: string;
        make?: string;
        model?: string;
        year?: number;
        vehicle_image?: string;
        vehicle_type?: string;
      }>;
    },
  });

  const { data: routeStatus, isLoading: isLoadingRouteStatus } = useQuery({
    queryKey: ['route-stock-status', stockVehicleId, stockServiceDate],
    queryFn: async () => {
      if (!stockVehicleId || !stockServiceDate) return [];
      const { data, error } = await supabase.rpc('get_route_stock_status', {
        vehicle_uuid: stockVehicleId,
        service_date: stockServiceDate,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!stockVehicleId && !!stockServiceDate,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Shared filter controls component
  const FilterControls = () => (
    <>
      {/* Search Input */}
      <div className="w-full md:flex-1 md:min-w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Enter Job ID (e.g., 2032) or Customer name"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="pl-10"
          />
        </div>
      </div>

      {/* Driver Filter */}
      <Button
        variant="outline"
        onClick={() => setShowDriverModal(true)}
        className="w-full md:w-48 justify-between min-h-[44px]"
      >
        <span className="truncate">
          {selectedDriver === 'all' 
            ? 'All Drivers' 
            : `${drivers.find(d => d.id === selectedDriver)?.first_name} ${drivers.find(d => d.id === selectedDriver)?.last_name}`
          }
        </span>
        <Users className="h-4 w-4 ml-2 opacity-50 flex-shrink-0" />
      </Button>

      {/* Job Type Filter */}
      <Select value={selectedJobType} onValueChange={onJobTypeChange}>
        <SelectTrigger className="w-full md:w-48 min-h-[44px]">
          <SelectValue placeholder="All Job Types" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-[9999]">
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
              Survey/Estimate
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-48 min-h-[44px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-[9999]">
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
              Completed Late
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Date Navigator */}
      {showDateNavigator && selectedDate && onDateChange && (
        <div className="w-full md:w-auto">
          <EnhancedDateNavigator
            date={selectedDate}
            onDateChange={onDateChange}
            label="Date"
          />
        </div>
      )}

      {/* Show Cancelled Jobs Toggle */}
      {onToggleCancelled && (
        <FilterToggle
          showCancelled={showCancelled}
          onToggle={onToggleCancelled}
          cancelledCount={cancelledCount}
        />
      )}
    </>
  );

  return (
    <TooltipProvider>
      <div className="space-y-1">
        {/* Universal Jobs Header */}
        {showUniversalHeader && selectedDate && (
          <UniversalJobsHeader
            selectedDate={selectedDate}
            jobsCount={jobsCount}
          />
        )}

        {/* Desktop Filters - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-4 flex-wrap">
          <FilterControls />
        </div>

        {/* Mobile Filters - Collapsible */}
        <div className="md:hidden">
          <MobileFilterPanel
            isOpen={mobileFiltersOpen}
            onToggle={setMobileFiltersOpen}
            activeFiltersCount={activeFiltersCount}
          >
            <div className="space-y-3">
              <FilterControls />
            </div>
          </MobileFilterPanel>
        </div>

        {/* Vehicle Selection Modal */}
        <StockVehicleSelectionModal
          open={showVehicleModal}
          onOpenChange={setShowVehicleModal}
          selectedDate={new Date()}
          selectedVehicle={{ id: stockVehicleId }}
          onVehicleSelect={(vehicle) => {
            setStockVehicleId(vehicle.id);
          }}
        />

        {/* Availability Tracker Sheet */}
        <AvailabilityTrackerSheet
          open={showAvailabilityTracker}
          onOpenChange={setShowAvailabilityTracker}
          selectedDate={selectedDate}
          onDateSelect={onDateChange}
        />

        {/* Multi-Select Driver Filter Modal */}
        <MultiSelectDriverFilter
          open={showDriverModal}
          onOpenChange={setShowDriverModal}
          selectedDrivers={selectedDriversForModal}
          onDriversChange={(drivers) => {
            if (drivers.length === 0) {
              onDriverChange('all');
            } else if (drivers.length === 1) {
              onDriverChange(drivers[0].id);
            } else {
              // Handle multiple drivers - for now just select the first
              onDriverChange(drivers[0].id);
            }
            setShowDriverModal(false);
          }}
        />
      </div>
    </TooltipProvider>
  );
};
