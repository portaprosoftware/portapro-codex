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
      // Get all active vehicles with spill kits
      const { data: vehiclesWithKits, error } = await supabase
        .from('vehicle_spill_kits')
        .select('id, vehicle_id, required_contents, updated_at')
        .eq('active', true);
      
      if (error) throw error;
      
      // Get all inventory items
      const { data: inventory } = await supabase
        .from('spill_kit_inventory')
        .select('id, current_stock, minimum_threshold, expiration_date');
      
      // Calculate stats
      const totalVehiclesWithKits = vehiclesWithKits?.length || 0;
      
      // Count vehicles needing inspection (inspections older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const needingInspection = vehiclesWithKits?.filter(vsk => 
        !vsk.updated_at || new Date(vsk.updated_at) < thirtyDaysAgo
      ).length || 0;
      
      // Count vehicles with missing/expired items
      let vehiclesWithIssues = 0;
      const inventoryMap = new Map(inventory?.map(i => [i.id, i]) || []);
      
      vehiclesWithKits?.forEach(vsk => {
        const contents = vsk.required_contents as Array<{inventory_item_id: string}>;
        const hasIssues = contents?.some(item => {
          const inv = inventoryMap.get(item.inventory_item_id);
          if (!inv) return true;
          if (inv.current_stock === 0) return true;
          if (inv.expiration_date && new Date(inv.expiration_date) < new Date()) return true;
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
    <div className="space-y-6">
      {/* Page Header with Stats */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground">Total Vehicles</div>
            <div className="text-2xl font-bold">{vehicles?.length || 0}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground">Maintenance</div>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.maintenance}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground">Retired</div>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.retired}</div>
          </div>
        </div>

        {/* Spill Kit Compliance Widget */}
        <Collapsible
          open={!isSpillKitCollapsed}
          onOpenChange={(open) => setIsSpillKitCollapsed(!open)}
          className="bg-white rounded-lg border shadow-sm"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
                <PackageCheck className="h-5 w-5 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="text-lg font-semibold">Spill Kit Compliance</h3>
                  <span className="text-sm text-muted-foreground">DOT/OSHA compliance monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {isSpillKitCollapsed ? 'Expand' : 'Collapse'}
                  </span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform flex-shrink-0",
                      isSpillKitCollapsed && "rotate-180"
                    )} 
                  />
                </div>
              </CollapsibleTrigger>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/fleet/compliance?tab=spill-kits')}
                className="ml-4"
              >
                View Details
              </Button>
            </div>
            
            <CollapsibleContent>
              <div className="grid grid-cols-4 gap-4 pt-4 mt-4 border-t">
                <div className="bg-card p-3 rounded-lg border shadow-sm">
                  <div className="text-sm text-muted-foreground">Vehicles with Kits</div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-blue-600" />
                    {spillKitStats?.totalVehiclesWithKits || 0}
                  </div>
                </div>
                
                <div className="bg-card p-3 rounded-lg border shadow-sm">
                  <div className="text-sm text-muted-foreground">Needing Inspection</div>
                  <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {spillKitStats?.needingInspection || 0}
                  </div>
                </div>
                
                <div className="bg-card p-3 rounded-lg border shadow-sm">
                  <div className="text-sm text-muted-foreground">Missing/Expired Items</div>
                  <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {spillKitStats?.vehiclesWithIssues || 0}
                  </div>
                </div>
                
                <div className="bg-card p-3 rounded-lg border shadow-sm">
                  <div className="text-sm text-muted-foreground">Low Stock Items</div>
                  <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {spillKitStats?.lowStockItems || 0}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Vehicle Controls Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          
          {/* View Mode */}
          <div className="flex border rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-l-md transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-r-md transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          {/* Add Vehicle */}
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
                  "inline-flex items-center text-sm font-medium py-1.5 px-3 rounded-full transition-colors",
                  getFilterButtonClass(status, statusFilter === status)
                )}
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

      {/* Vehicle Grid/List */}
      <div className={cn(
        viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"
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
          <p className="text-base font-normal text-gray-500">No vehicles found matching your criteria.</p>
        </div>
      )}

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
