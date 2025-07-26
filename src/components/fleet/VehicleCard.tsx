
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  status: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  last_known_location?: any;
  created_at: string;
  current_mileage?: number;
  vehicle_image?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  viewMode: "grid" | "list";
  onManage?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, viewMode, onManage }) => {
  const getStatusClasses = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-gradient-green text-white font-bold border-0";
      case "maintenance":
        return "bg-gradient-orange text-white font-bold border-0";
      case "in_service":
        return "bg-gradient-red text-white font-bold border-0";
      default:
        return "bg-gradient-red text-white font-bold border-0";
    }
  };

  const getVehicleImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  if (viewMode === "list") {
    return (
      <div className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
              {vehicle.vehicle_image ? (
                <img
                  src={getVehicleImageUrl(vehicle.vehicle_image)}
                  alt="Vehicle"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Truck className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">{vehicle.license_plate}</h3>
              <div className="flex items-center space-x-4 mt-1">
                {vehicle.make && vehicle.model && (
                  <span className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</span>
                )}
                {vehicle.vehicle_type && (
                  <span className="text-sm text-muted-foreground">• {vehicle.vehicle_type}</span>
                )}
                <span className={cn("inline-block text-xs font-medium py-1 px-2 rounded-md", getStatusClasses(vehicle.status))}>
                  {vehicle.status === 'available' ? 'Available' : vehicle.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => onManage?.(vehicle)}
            variant="outline"
          >
            View Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Vehicle Image */}
      <div className="h-32 w-full bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
        {vehicle.vehicle_image ? (
          <img
            src={getVehicleImageUrl(vehicle.vehicle_image)}
            alt="Vehicle"
            className="w-full h-full object-cover"
          />
        ) : (
          <Truck className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      
      {/* License Plate */}
      <h3 className="text-lg font-medium mb-4">{vehicle.license_plate}</h3>
      
      {/* Vehicle Details */}
      <div className="space-y-3">
        {vehicle.make && vehicle.model && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Make/Model:</span>
            <span className="text-sm">{vehicle.make} {vehicle.model}</span>
          </div>
        )}
        
        {vehicle.vehicle_type && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Type:</span>
            <span className="text-sm">{vehicle.vehicle_type}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <span className={cn("inline-block text-xs font-medium py-1 px-2 rounded-md", getStatusClasses(vehicle.status))}>
            {vehicle.status === 'available' ? 'Available' : vehicle.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
      </div>
      
      {/* Action Button */}
      <Button
        onClick={() => onManage?.(vehicle)}
        variant="ocean"
        className="w-full mt-4"
      >
        Manage
      </Button>
    </div>
  );
};
