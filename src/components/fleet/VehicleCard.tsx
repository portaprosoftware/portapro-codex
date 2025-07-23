
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

interface VehicleCardProps {
  vehicle: Vehicle;
  viewMode: "grid" | "list";
  onManage?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, viewMode, onManage }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "badge-green";
      case "maintenance":
        return "badge-orange";
      case "retired":
        return "badge-red";
      default:
        return "badge-blue";
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{vehicle.license_plate}</h3>
              <p className="text-gray-600">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-sm text-gray-500 capitalize">{vehicle.vehicle_type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={cn("badge-gradient", getStatusColor(vehicle.status))}>
              {vehicle.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => onManage?.(vehicle)}>
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow bg-white overflow-hidden">
      {/* Vehicle Image/Icon Section */}
      <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
        <Truck className="w-12 h-12 text-blue-600" />
        <Badge className={cn("absolute top-2 right-2 badge-gradient", getStatusColor(vehicle.status))}>
          {vehicle.status}
        </Badge>
      </div>
      
      {/* Vehicle Details */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{vehicle.license_plate}</h3>
          <p className="text-gray-600 font-medium">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-sm text-gray-500 capitalize">{vehicle.vehicle_type}</p>
        </div>

        <div className="space-y-2">
          {vehicle.current_mileage && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              {vehicle.current_mileage.toLocaleString()} miles
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            Added {new Date(vehicle.created_at).toLocaleDateString()}
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => onManage?.(vehicle)}
        >
          <Settings className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </Card>
  );
};
