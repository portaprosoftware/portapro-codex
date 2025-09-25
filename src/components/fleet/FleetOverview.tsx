
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleCard } from "./VehicleCard";
import { VehicleDetailModal } from "./VehicleDetailModal";
import { VehicleManagement } from "./VehicleManagement";
import { FuelManagement } from "./FuelManagement";
import { AddVehicleModal } from "./AddVehicleModal";
import { Grid, List, Search, Plus, Truck, Fuel, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForQuery } from "@/lib/dateUtils";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "available" | "in_service" | "maintenance" | "assigned_today";

export const FleetOverview: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [pageMode, setPageMode] = useState("overview");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: todayAssignments } = useQuery({
    queryKey: ["vehicle-assignments-today"],
    queryFn: async () => {
      const today = formatDateForQuery(new Date());
      const { data, error } = await supabase
        .from("daily_vehicle_assignments")
        .select("vehicle_id")
        .eq("assignment_date", today);
      
      if (error) throw error;
      return data || [];
    },
  });

  const assignedTodayVehicleIds = new Set(todayAssignments?.map(a => a.vehicle_id) || []);

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "assigned_today") {
      matchesStatus = assignedTodayVehicleIds.has(vehicle.id);
    } else {
      matchesStatus = vehicle.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => (a.make || '').localeCompare(b.make || ''));

  const statusCounts = {
    all: vehicles?.length || 0,
    available: vehicles?.filter(v => v.status === "available").length || 0,
    in_service: vehicles?.filter(v => v.status === "in_service").length || 0,
    maintenance: vehicles?.filter(v => v.status === "maintenance").length || 0,
    assigned_today: vehicles?.filter(v => assignedTodayVehicleIds.has(v.id)).length || 0,
  };

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
            <div className="text-sm text-muted-foreground">Available</div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.available}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground">In Service</div>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.in_service}</div>
          </div>
          <div className="bg-card p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground">Maintenance</div>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.maintenance}</div>
          </div>
        </div>

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
          {(['all', 'available', 'in_service', 'maintenance', 'assigned_today'] as const).map((status) => {
            const getFilterButtonClass = (status: string, isActive: boolean) => {
              if (!isActive) {
                return "bg-muted text-muted-foreground hover:bg-muted/80";
              }
              
              switch (status) {
                case 'available':
                  return "bg-gradient-green text-white font-bold";
                case 'in_service':
                  return "bg-gradient-red text-white font-bold";
                case 'maintenance':
                  return "bg-gradient-orange text-white font-bold";
                case 'assigned_today':
                  return "bg-gradient-primary text-white font-bold";
                default:
                  return "bg-primary text-primary-foreground";
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
                {status === 'all' ? 'All' : status === 'assigned_today' ? 'In Service' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          isOpen={isVehicleModalOpen}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setSelectedVehicle(null);
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
