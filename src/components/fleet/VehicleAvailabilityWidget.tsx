import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Truck, Search, MapPin, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year?: number;
  nickname?: string;
  vehicle_type: string;
  status: string;
  current_mileage?: number;
  last_known_location?: any;
}

interface VehicleAvailabilityWidgetProps {
  selectedDate?: Date;
  selectedVehicle?: any;
  onVehicleSelect?: (vehicle: any) => void;
  selectionMode?: boolean;
  className?: string;
}

export const VehicleAvailabilityWidget: React.FC<VehicleAvailabilityWidgetProps> = ({
  selectedDate = new Date(),
  selectedVehicle,
  onVehicleSelect,
  selectionMode = false,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles-availability", selectedDate],
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

  const { data: assignments } = useQuery({
    queryKey: ["vehicle-assignments", selectedDate],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_vehicle_assignments")
        .select("vehicle_id")
        .eq("assignment_date", dateStr);
      
      if (error) throw error;
      return data.map(a => a.vehicle_id);
    },
  });

  const filteredVehicles = vehicles?.filter(vehicle => 
    vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.vehicle_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVehicleStatus = (vehicleId: string) => {
    return assignments?.includes(vehicleId) ? "assigned" : "available";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 border-green-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "maintenance": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Vehicle Availability</h3>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Available</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Assigned</span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredVehicles?.map((vehicle) => {
          const status = getVehicleStatus(vehicle.id);
          const isSelected = selectedVehicle?.id === vehicle.id;
          
          return (
            <Card
              key={vehicle.id}
              className={cn(
                "p-3 cursor-pointer transition-all hover:shadow-sm",
                selectionMode && "hover:bg-accent/50",
                isSelected && "ring-2 ring-primary bg-accent/30",
                !selectionMode && "cursor-default"
              )}
              onClick={() => {
                if (selectionMode && onVehicleSelect) {
                  onVehicleSelect(vehicle);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  status === "available" ? "bg-green-100" : "bg-blue-100"
                )}>
                  <Truck className={cn(
                    "w-5 h-5",
                    status === "available" ? "text-green-600" : "text-blue-600"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {vehicle.license_plate}
                    </p>
                    <Badge variant="outline" className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.make} {vehicle.model} • {vehicle.vehicle_type}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    {vehicle.current_mileage && (
                      <div className="flex items-center space-x-1">
                        <Gauge className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {vehicle.current_mileage.toLocaleString()} mi
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredVehicles?.length === 0 && (
        <div className="text-center py-6">
          <Truck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No vehicles found</p>
        </div>
      )}
    </div>
  );
};