
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleCard } from "./VehicleCard";
import { VehicleDetailModal } from "./VehicleDetailModal";
import { VehicleManagement } from "./VehicleManagement";
import { FuelManagement } from "./FuelManagement";
import { FleetSidebar } from "./FleetSidebar";
import { AddVehicleModal } from "./AddVehicleModal";
import { Grid, List, Search, Plus, Truck, Fuel, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "maintenance" | "retired";

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

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: vehicles?.length || 0,
    active: vehicles?.filter(v => v.status === "active").length || 0,
    maintenance: vehicles?.filter(v => v.status === "maintenance").length || 0,
    retired: vehicles?.filter(v => v.status === "retired").length || 0,
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
    <div className="flex h-full bg-gray-50">
      <FleetSidebar />
      <div className="flex-1 max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Fleet Overview</h1>
            <p className="text-base font-normal text-gray-500 mt-1">{statusCounts.all} of {statusCounts.all} vehicles</p>
          </div>
        </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pl-10 text-base font-normal text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
            )}
          >
            <Grid className="w-4 h-4 mr-2" />
            Icons
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
            )}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </button>
          <button
            onClick={() => setIsAddVehicleModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as StatusFilter)}
            className={cn(
              "inline-flex items-center py-1 px-3 text-sm font-semibold rounded-full transition-colors",
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
          >
            <span className="capitalize">{status}</span>
            <span className="ml-1">({count})</span>
          </button>
        ))}
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
    </div>
  );
};
