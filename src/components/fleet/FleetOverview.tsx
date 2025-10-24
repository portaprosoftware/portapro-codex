import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleCard } from "./VehicleCard";
import { VehicleDetailDrawer } from "./VehicleDetailDrawer";
import { VehicleManagement } from "./VehicleManagement";
import { FuelManagement } from "./FuelManagement";
import { AddVehicleModal } from "./AddVehicleModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Grid, List, Search, Plus, Truck, Fuel, Settings, PackageCheck, AlertCircle, TruckIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "maintenance" | "retired";

export const FleetOverview: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [pageMode, setPageMode] = useState("overview");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isSpillKitCollapsed, setIsSpillKitCollapsed] = useState(true);
  const [manuallyClosedVehicleId, setManuallyClosedVehicleId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Invalidate and refetch vehicles query when component mounts or when returning to overview
  useEffect(() => {
    if (pageMode === "overview") {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    }
  }, [pageMode, queryClient]);

  const { data: vehicles, isLoading, refetch } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Always refetch when component mounts
  });

  // Phase 5: Handle URL-based vehicle selection (after vehicles are loaded)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('vehicle');
    
    if (vehicleId && vehicles) {
      // Don't re-open if this vehicle was just manually closed
      if (vehicleId === manuallyClosedVehicleId) {
        return;
      }
      
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && !isVehicleModalOpen) {
        setSelectedVehicle(vehicle);
        setIsVehicleModalOpen(true);
        setManuallyClosedVehicleId(null); // Clear the flag when opening
      }
    }
  }, [vehicles, isVehicleModalOpen, manuallyClosedVehicleId]);

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => (a.make || '').localeCompare(b.make || ''));

  const statusCounts = {
    all: vehicles?.length || 0,
    active: vehicles?.filter(v => v.status === "active").length || 0,
    maintenance: vehicles?.filter(v => v.status === "maintenance").length || 0,
    retired: vehicles?.filter(v => v.status === "retired").length || 0,
  };

  // Fetch spill kit stats for compliance widget
  const { data: spillKitStats } = useQuery({
    queryKey: ['fleet-spill-kit-stats'],
    queryFn: async () => {
      // Get all active vehicles
      const { data: allVehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('status', 'active');
      
      // Get latest spill kit check for each vehicle
      const { data: allChecks, error } = await supabase
        .from('vehicle_spill_kit_checks')
        .select('vehicle_id, has_kit, item_conditions, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get all inventory items
      const { data: inventory } = await supabase
        .from('spill_kit_inventory')
        .select('id, current_stock, minimum_threshold, expiration_date');
      
      // Get latest check per vehicle
      const latestChecksByVehicle = new Map();
      allChecks?.forEach(check => {
        if (!latestChecksByVehicle.has(check.vehicle_id)) {
          latestChecksByVehicle.set(check.vehicle_id, check);
        }
      });
      
      // Calculate stats
      const vehiclesWithKits = Array.from(latestChecksByVehicle.values()).filter(check => check.has_kit);
      const totalVehiclesWithKits = vehiclesWithKits.length;
      
      // Count vehicles needing inspection (last check older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const needingInspection = vehiclesWithKits.filter(check => 
        new Date(check.created_at) < thirtyDaysAgo
      ).length;
      
      // Count vehicles with missing/expired items from latest check
      let vehiclesWithIssues = 0;
      vehiclesWithKits.forEach(check => {
        const itemConditions = check.item_conditions as Array<{
          item_name: string;
          expiration_date?: string;
          is_missing?: boolean;
        }>;
        
        if (!itemConditions || itemConditions.length === 0) return;
        
        const hasIssues = itemConditions.some(item => {
          if (item.is_missing) return true;
          if (item.expiration_date && new Date(item.expiration_date) < new Date()) return true;
          return false;
        });
        
        if (hasIssues) vehiclesWithIssues++;
      });
      
      // Count low stock items affecting vehicles
      const lowStockItems = inventory?.filter(i => 
        i.current_stock <= i.minimum_threshold
      ).length || 0;
      
      return {
        totalVehiclesWithKits,
        needingInspection,
        vehiclesWithIssues,
        lowStockItems
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleManageVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsVehicleModalOpen(true);
    setManuallyClosedVehicleId(null); // Clear flag when explicitly opening
  };

  if (pageMode === "management") {
    return <VehicleManagement onBack={() => setPageMode("overview")} />;
  }

  if (pageMode === "fuel") {
    return <FuelManagement />;
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Single White Card - All Content */}
      <div className="bg-white rounded-xl border shadow-sm p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-card p-3 rounded-lg border shadow-sm text-center">
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold truncate">Total Vehicles</div>
            <div className="text-2xl font-bold">{vehicles?.length || 0}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm text-center">
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold truncate">Active</div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm text-center">
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold truncate">Maintenance</div>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.maintenance}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm text-center">
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold truncate">Retired</div>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.retired}</div>
          </div>
        </div>

        {/* Spill Kit Compliance Widget */}
        <div>
          <Collapsible
            open={!isSpillKitCollapsed}
            onOpenChange={(open) => setIsSpillKitCollapsed(!open)}
            className="bg-white rounded-lg border shadow-sm relative"
          >
            <div className="p-4 lg:p-6">
              <div className="flex items-start lg:items-center justify-between gap-3">
                <CollapsibleTrigger className="flex items-center gap-2 lg:gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
                  <PackageCheck className="h-5 w-5 flex-shrink-0" />
                  <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2 flex-1 min-w-0">
                    <h3 className="text-base lg:text-lg font-semibold truncate">Spill Kit Compliance</h3>
                    <span className="text-xs lg:text-sm text-muted-foreground hidden sm:inline">DOT/OSHA compliance monitoring</span>
                  </div>
                  <span className="text-xs text-muted-foreground hidden lg:inline mr-2">
                    {isSpillKitCollapsed ? 'Click to expand' : 'Click to collapse'}
                  </span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform flex-shrink-0",
                      isSpillKitCollapsed && "rotate-180"
                    )} 
                    aria-label={isSpillKitCollapsed ? 'Expand' : 'Collapse'}
                  />
                </CollapsibleTrigger>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/fleet/compliance?tab=spill-kits')}
                  className="hidden lg:flex ml-4"
                >
                  View Details
                </Button>
              </div>
              
              <CollapsibleContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 pt-4 mt-4 border-t">
                  <div className="bg-card p-3 rounded-lg border shadow-sm">
                    <div className="text-xs lg:text-sm text-muted-foreground truncate">Vehicles with Kits</div>
                    <div className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                      <TruckIcon className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                      {spillKitStats?.totalVehiclesWithKits || 0}
                    </div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-lg border shadow-sm">
                    <div className="text-xs lg:text-sm text-muted-foreground truncate">Needing Inspection</div>
                    <div className="text-xl lg:text-2xl font-bold text-orange-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                      {spillKitStats?.needingInspection || 0}
                    </div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-lg border shadow-sm">
                    <div className="text-xs lg:text-sm text-muted-foreground truncate">Missing/Expired Items</div>
                    <div className="text-xl lg:text-2xl font-bold text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                      {spillKitStats?.vehiclesWithIssues || 0}
                    </div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-lg border shadow-sm">
                    <div className="text-xs lg:text-sm text-muted-foreground truncate">Low Stock Items</div>
                    <div className="text-xl lg:text-2xl font-bold text-yellow-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                      {spillKitStats?.lowStockItems || 0}
                    </div>
                  </div>
                </div>
                
                {/* Mobile View Details Button */}
                <div className="lg:hidden mt-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/fleet/compliance?tab=spill-kits')}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Vehicle Controls and Filters */}
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Search - Full width on mobile, flex on desktop */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[44px]"
                aria-label="Search vehicles"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-l-md transition-colors min-h-[44px]",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-r-md transition-colors min-h-[44px]",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          {/* Add Vehicle Button */}
          <Button
            onClick={() => setIsAddVehicleModalOpen(true)}
            className="bg-gradient-primary text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>


        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'maintenance', 'retired'] as const).map((status) => {
            const getFilterButtonClass = (status: string, isActive: boolean) => {
              if (!isActive) {
                return "bg-muted text-muted-foreground hover:bg-muted/80";
              }
              
              switch (status) {
                case 'active':
                  return "bg-gradient-green text-white font-bold";
                case 'maintenance':
                  return "bg-gradient-orange text-white font-bold";
                case 'retired':
                  return "bg-gray-500 text-white font-bold";
                default:
                  return "bg-primary text-primary-foreground font-bold";
              }
            };

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "inline-flex items-center text-sm font-medium py-2 px-3 rounded-full transition-colors min-h-[44px]",
                  getFilterButtonClass(status, statusFilter === status)
                )}
                role="tab"
                aria-selected={statusFilter === status}
                aria-label={`Filter by ${status} vehicles`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {status !== 'all' && (
                  <span className="ml-1">
                    ({statusCounts[status]})
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Vehicle Grid/List */}
        <div className={cn(
        viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4" 
          : "space-y-3 lg:space-y-4"
      )}>
        {filteredVehicles?.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            viewMode={viewMode}
            onManage={handleManageVehicle}
          />
        ))}
        </div>

        {filteredVehicles?.length === 0 && (
          <div className="text-center py-12">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-base font-normal text-gray-500 mb-4">No vehicles found matching your criteria.</p>
          {searchQuery && (
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
            >
              Clear filters
            </Button>
          )}
          </div>
        )}
      </div>

      {/* Floating Action Button - Mobile Only */}
      <button
        onClick={() => setIsAddVehicleModalOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-20 w-14 h-14 bg-gradient-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
        aria-label="Add Vehicle"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Vehicle Detail Drawer */}
      {selectedVehicle && (
        <VehicleDetailDrawer
          vehicle={selectedVehicle}
          isOpen={isVehicleModalOpen}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setManuallyClosedVehicleId(selectedVehicle.id); // Track manually closed vehicle
            setSelectedVehicle(null);
            
            // Clear URL parameter
            const url = new URL(window.location.href);
            url.searchParams.delete('vehicle');
            window.history.pushState({}, '', url.toString());
          }}
        />
      )}

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
      />
    </div>
  );
};
