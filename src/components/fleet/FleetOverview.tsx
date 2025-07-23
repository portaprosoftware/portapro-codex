
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleCard } from "./VehicleCard";
import { VehicleManagement } from "./VehicleManagement";
import { FuelManagement } from "./FuelManagement";
import { Grid, List, Search, Plus, Truck, Fuel, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "maintenance" | "retired";
type PageMode = "overview" | "management" | "fuel";

export const FleetOverview: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageMode, setPageMode] = useState<PageMode>("overview");

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

  // Handle page mode switching
  if (pageMode === "management") {
    return <VehicleManagement />;
  }

  if (pageMode === "fuel") {
    return <FuelManagement />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Overview</h1>
          <p className="text-gray-600 mt-1">All vehicles</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={pageMode === "overview" ? "default" : "outline"}
            onClick={() => setPageMode("overview")}
          >
            <Truck className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={pageMode === "management" ? "default" : "outline"}
            onClick={() => setPageMode("management")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
          <Button
            variant={pageMode === "fuel" ? "default" : "outline"}
            onClick={() => setPageMode("fuel")}
          >
            <Fuel className="w-4 h-4 mr-2" />
            Fuel
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="w-4 h-4 mr-2" />
            Icons
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
          <Button onClick={() => setPageMode("management")}>
            <Plus className="w-4 h-4 mr-2" />
            Manage Vehicles
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status as StatusFilter)}
            className="capitalize"
          >
            {status} ({count})
          </Button>
        ))}
      </div>

      {/* Vehicle Grid/List */}
      <div className={cn(
        "gap-4",
        viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "space-y-4"
      )}>
        {filteredVehicles?.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            viewMode={viewMode}
          />
        ))}
      </div>

      {filteredVehicles?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No vehicles found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
