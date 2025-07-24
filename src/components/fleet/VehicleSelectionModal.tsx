import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Truck, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  nickname?: string;
  vehicle_type: string;
  status: string;
  current_mileage?: number;
}

interface VehicleSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedVehicle?: Vehicle;
  onVehicleSelect: (vehicle: Vehicle) => void;
}

export const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedVehicle,
  onVehicleSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active")
        .order("license_plate");

      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["daily-vehicle-assignments", selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const { data, error } = await supabase
        .from("daily_vehicle_assignments")
        .select("vehicle_id")
        .eq("assignment_date", selectedDate.toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedDate,
  });

  const assignedVehicleIds = new Set(assignments.map(a => a.vehicle_id));

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.nickname?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isAssigned = assignedVehicleIds.has(vehicle.id);
    
    if (statusFilter === "available") return matchesSearch && !isAssigned;
    if (statusFilter === "assigned") return matchesSearch && isAssigned;
    return matchesSearch;
  });

  const getAvailabilityStatus = (vehicleId: string) => {
    return assignedVehicleIds.has(vehicleId) ? "assigned" : "available";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/10 text-green-700 border-green-200";
      case "assigned": return "bg-blue-500/10 text-blue-700 border-blue-200";
      default: return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-none md:max-w-4xl md:h-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none md:max-w-4xl md:h-auto md:max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Select Vehicle</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search vehicles by license plate, make, model, or nickname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All ({filteredVehicles.length})
              </Button>
              <Button
                variant={statusFilter === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("available")}
              >
                Available ({filteredVehicles.filter(v => !assignedVehicleIds.has(v.id)).length})
              </Button>
              <Button
                variant={statusFilter === "assigned" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("assigned")}
              >
                Assigned ({filteredVehicles.filter(v => assignedVehicleIds.has(v.id)).length})
              </Button>
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => {
                const availabilityStatus = getAvailabilityStatus(vehicle.id);
                const isSelected = selectedVehicle?.id === vehicle.id;
                
                return (
                  <div
                    key={vehicle.id}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    {/* Vehicle Icon */}
                    <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-lg mb-4 mx-auto">
                      <Truck className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* License Plate */}
                    <h3 className="text-lg font-semibold text-center mb-2">
                      {vehicle.license_plate}
                    </h3>

                    {/* Vehicle Details */}
                    <div className="space-y-2 text-sm">
                      <p className="text-center text-muted-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      
                      {vehicle.nickname && (
                        <p className="text-center font-medium">
                          "{vehicle.nickname}"
                        </p>
                      )}

                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          {vehicle.vehicle_type}
                        </Badge>
                      </div>

                      <div className="flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(availabilityStatus)}`}
                        >
                          {availabilityStatus === "available" ? "Available" : "Assigned"}
                        </Badge>
                      </div>

                      {vehicle.current_mileage && (
                        <p className="text-center text-xs text-muted-foreground">
                          {vehicle.current_mileage.toLocaleString()} miles
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No vehicles found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {selectedVehicle && (
          <div className="p-6 pt-4 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedVehicle.license_plate}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  {selectedVehicle.nickname && ` "${selectedVehicle.nickname}"`}
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)}>
                Confirm Selection
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};