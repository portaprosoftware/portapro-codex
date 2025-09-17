import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check, Info, X, ChevronDown, ChevronUp, Calendar, Truck } from 'lucide-react';
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

        <div className="flex items-center gap-4 flex-wrap">
          {/* Search Input */}
          <div className="flex-1 min-w-80">
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
        <Select value={selectedDriver} onValueChange={onDriverChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-[9999]">
            {/* Key directly above driver names */}
            <div className="flex items-center gap-2 text-xs text-gray-600 px-2 py-1 border-b border-gray-100">
              <span>Drivers With Jobs Today</span>
              <Truck className="w-3 h-3 text-green-500" />
            </div>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.filter(driver => driver.id && driver.id.trim() !== '').map(driver => (
               <SelectItem key={driver.id} value={driver.id}>
                 <div className="flex items-center w-full">
                   <span className="truncate">{driver.first_name} {driver.last_name}</span>
                   {driversWithJobsToday.has(driver.id) && (
                     <>
                       <span className="mx-1"> - </span>
                       <Truck className="w-3 h-3 text-green-500" />
                     </>
                   )}
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
          <SelectTrigger className="w-48">
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
          <div className="flex items-center gap-2">
            <EnhancedDateNavigator
              date={selectedDate}
              onDateChange={onDateChange}
              label="Date"
            />
            
            {/* Today/Tomorrow Quick Select Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(new Date())}
              className="text-xs px-3 py-1"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onDateChange(tomorrow);
              }}
              className="text-xs px-3 py-1"
            >
              Tomorrow
            </Button>
          </div>
          )}

          {/* Availability Tracker Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAvailabilityTracker(true)}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Product Availability
          </Button>

          {/* Route vs Truck Stock Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRouteStock(!showRouteStock)}
            className="flex items-center gap-2"
          >
            {showRouteStock ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Route vs Truck Stock
          </Button>

          {/* Show Cancelled Jobs Toggle */}
          {onToggleCancelled && (
            <FilterToggle
              showCancelled={showCancelled}
              onToggle={onToggleCancelled}
              cancelledCount={cancelledCount}
            />
          )}
        </div>

        {/* Route vs Truck Stock Section */}
        {showRouteStock && (
          <Card className="p-4 space-y-3 mt-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">Route vs Truck Stock</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-1 hover:bg-muted rounded-full transition-colors">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>How This Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This tool helps you ensure your truck has enough supplies before starting your route.
                    </p>
                    <div className="space-y-2 text-xs">
                      <p><strong>Needed:</strong> Total supplies required for all jobs assigned to this truck</p>
                      <p><strong>On Truck:</strong> Current stock levels loaded on the vehicle</p>
                      <p><strong>Deficit:</strong> How many more items you need to load</p>
                      <p><strong>Status:</strong> "OK" means you're ready, "Replenish" means load more supplies</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
          </Card>
        )}
        
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

        {/* Availability Tracker Sheet */}
        <AvailabilityTrackerSheet
          open={showAvailabilityTracker}
          onOpenChange={setShowAvailabilityTracker}
          selectedDate={selectedDate}
          onDateSelect={onDateChange}
        />
      </div>
    </TooltipProvider>
  );
};