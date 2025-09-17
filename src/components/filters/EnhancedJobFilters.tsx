import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Info, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { FilterChipBar } from './FilterChipBar';
import { SavePresetModal } from './SavePresetModal';
import { EnhancedPDFExport } from './EnhancedPDFExport';
import { SavedPresets } from './SavedPresets';
import { useFilterPresets, FilterData, FilterPreset } from '@/hooks/useFilterPresets';
import { useJobCounts } from '@/hooks/useJobCounts';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockVehicleSelectionModal } from '@/components/fleet/StockVehicleSelectionModal';

interface EnhancedJobFiltersProps {
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
  jobs: any[];
  onExport: () => void;
  resultsCount: number;
  totalCount: number;
}

export const EnhancedJobFilters: React.FC<EnhancedJobFiltersProps> = ({
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
  jobs,
  onExport,
  resultsCount,
  totalCount
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [stockVehicleId, setStockVehicleId] = useState<string>('');
  const [stockServiceDate, setStockServiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  
  const { savePreset, isSaving } = useFilterPresets('jobs');
  const { data: jobCounts } = useJobCounts();
  const { toast } = useToast();

  // Route vs Truck Stock queries
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-enhanced'],
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

  const clearAllFilters = () => {
    onDateRangeChange(undefined);
    onSearchTermChange('');
    onDriverChange('all');
    onJobTypeChange('all');
    onStatusChange('all');
  };

  const getCurrentFilterData = (): FilterData => ({
    dateRange,
    searchTerm,
    selectedDriver,
    selectedJobType,
    selectedStatus,
  });

  const handleSavePreset = (name: string, description?: string) => {
    const filterData = getCurrentFilterData();
    savePreset({ name, description, filterData });
  };

  const handleSharePreset = () => {
    const filterData = getCurrentFilterData();
    
    // Build URL with current filter parameters
    const params = new URLSearchParams();
    
    if (filterData.dateRange?.from) {
      params.set('from', format(filterData.dateRange.from, 'yyyy-MM-dd'));
    }
    if (filterData.dateRange?.to) {
      params.set('to', format(filterData.dateRange.to, 'yyyy-MM-dd'));
    }
    if (filterData.searchTerm) {
      params.set('search', filterData.searchTerm);
    }
    if (filterData.selectedDriver && filterData.selectedDriver !== 'all') {
      params.set('driver', filterData.selectedDriver);
    }
    if (filterData.selectedJobType && filterData.selectedJobType !== 'all') {
      params.set('jobType', filterData.selectedJobType);
    }
    if (filterData.selectedStatus && filterData.selectedStatus !== 'all') {
      params.set('status', filterData.selectedStatus);
    }
    
    const shareUrl = `${window.location.origin}/jobs/custom?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: 'Link Copied',
      description: 'Filter share link copied to clipboard.',
    });
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    const { dateRange, searchTerm, selectedDriver, selectedJobType, selectedStatus } = preset.filter_data;
    
    // Apply all filters from the preset
    if (dateRange) {
      // Ensure date range has proper Date objects
      const convertedRange = {
        from: dateRange.from ? new Date(dateRange.from) : undefined,
        to: dateRange.to ? new Date(dateRange.to) : undefined,
      };
      onDateRangeChange(convertedRange);
    }
    if (searchTerm) onSearchTermChange(searchTerm);
    if (selectedDriver) onDriverChange(selectedDriver);
    if (selectedJobType) onJobTypeChange(selectedJobType);
    if (selectedStatus) onStatusChange(selectedStatus);
    
    toast({
      title: 'Preset Applied',
      description: `Applied "${preset.name}" filter preset.`,
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filter Chip Bar */}
        <FilterChipBar
          dateRange={dateRange}
          searchTerm={searchTerm}
          selectedDriver={selectedDriver}
          selectedJobType={selectedJobType}
          selectedStatus={selectedStatus}
          drivers={drivers}
          onRemoveDateRange={() => onDateRangeChange(undefined)}
          onRemoveSearchTerm={() => onSearchTermChange('')}
          onRemoveDriver={() => onDriverChange('all')}
          onRemoveJobType={() => onJobTypeChange('all')}
          onRemoveStatus={() => onStatusChange('all')}
          onClearAll={clearAllFilters}
          onSavePreset={() => setShowSaveModal(true)}
          onSharePreset={handleSharePreset}
          resultsCount={resultsCount}
          totalCount={totalCount}
        />

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onExport}
            variant="outline"
            size="sm"
            disabled={resultsCount === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV Export ({resultsCount})
          </Button>
          
          <EnhancedPDFExport
            jobs={jobs}
            totalCount={totalCount}
            filterData={getCurrentFilterData()}
            drivers={drivers}
          />
        </div>

        {/* Always Visible Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Saved Presets */}
          <SavedPresets 
            onApplyPreset={handleApplyPreset}
            className="lg:col-span-1"
          />

          {/* Main Filters */}
          <Card className="p-6 space-y-6 lg:col-span-2">
            {/* Quick Range Buttons with Live Counts */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Quick Date Ranges</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {quickRanges.map((quickRange, index) => {
                  const counts = [
                    jobCounts?.last7Days || 0,
                    jobCounts?.last30Days || 0,
                    jobCounts?.monthToDate || 0,
                    null, // Last Quarter - not in our counts yet
                    jobCounts?.quarterToDate || 0,
                    jobCounts?.yearToDate || 0,
                  ];
                  
                  return (
                    <Button
                      key={quickRange.label}
                      variant="outline"
                      size="sm"
                      onClick={() => onDateRangeChange(quickRange.range)}
                      className="text-xs justify-start h-auto py-3 px-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">{quickRange.label}</div>
                        <div className="text-muted-foreground text-xs">
                          {counts[index] !== null ? `${counts[index]} jobs` : 'Click to filter'}
                        </div>
                      </div>
                    </Button>
                  );
                })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Job ID Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Job ID (e.g., 2032)..."
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
                      Completed Late
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Route vs Truck Stock Section */}
            <div className="space-y-4">
              <Separator />
              
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">Route vs Truck Stock</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 hover:bg-muted rounded-full transition-colors">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4 z-50 bg-popover border shadow-md pointer-events-auto" side="top">
                    <div className="space-y-2">
                      <h4 className="font-medium">How This Works</h4>
                      <p className="text-sm text-muted-foreground">
                        This tool helps you ensure your truck has enough supplies before starting your route.
                      </p>
                      <div className="space-y-1 text-xs">
                        <p><strong>Needed:</strong> Total supplies required for all jobs assigned to this truck</p>
                        <p><strong>On Truck:</strong> Current stock levels loaded on the vehicle</p>
                        <p><strong>Deficit:</strong> How many more items you need to load</p>
                        <p><strong>Status:</strong> "OK" means you're ready, "Replenish" means load more supplies</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Vehicle</label>
                  <Button
                    variant="outline"
                    onClick={() => setShowVehicleModal(true)}
                    className="justify-start h-10 w-full"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {stockVehicleId ? 
                      vehicles?.find(v => v.id === stockVehicleId)?.license_plate || 'Selected Vehicle' : 
                      'Select Vehicle'
                    }
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Service Date</label>
                    <Input type="date" value={stockServiceDate} onChange={(e) => setStockServiceDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {!stockVehicleId ? (
                <div className="text-sm text-muted-foreground">Pick a vehicle and date to check stock readiness.</div>
              ) : isLoadingRouteStatus ? (
                <div className="text-sm text-muted-foreground">Checking stock...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Needed</TableHead>
                      <TableHead>On Truck</TableHead>
                      <TableHead>Deficit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(routeStatus || []).map((row: any) => (
                      <TableRow key={row.consumable_id}>
                        <TableCell className="font-medium">{row.consumable_name}</TableCell>
                        <TableCell>{row.needed_qty}</TableCell>
                        <TableCell>{row.vehicle_balance}</TableCell>
                        <TableCell>{row.deficit}</TableCell>
                        <TableCell>
                          {row.ok ? (
                            <Badge variant="secondary">OK</Badge>
                          ) : (
                            <Badge variant="destructive">Replenish</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>

        {/* Vehicle Selection Modal */}
        <StockVehicleSelectionModal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          vehicles={vehicles || []}
          selectedVehicleId={stockVehicleId}
          onSelectVehicle={(vehicleId) => {
            setStockVehicleId(vehicleId);
            setShowVehicleModal(false);
          }}
        />

        {/* Save Preset Modal */}
        <SavePresetModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSavePreset}
          filterData={getCurrentFilterData()}
          isSaving={isSaving}
        />
      </div>
    </TooltipProvider>
  );
};