
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
  status: "active" | "maintenance" | "retired";
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  last_known_location?: any;
  created_at: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  viewMode: "grid" | "list";
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, viewMode }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "maintenance":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "retired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{vehicle.license_plate}</h3>
              <p className="text-sm text-gray-600">
                {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.vehicle_type}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={cn("capitalize", getStatusColor(vehicle.status))}>
              {vehicle.status}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <Badge className={cn("capitalize", getStatusColor(vehicle.status))}>
            {vehicle.status}
          </Badge>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{vehicle.license_plate}</h3>
          <p className="text-sm text-gray-600">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-xs text-gray-500 capitalize">{vehicle.vehicle_type}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="w-3 h-3 mr-1" />
            Last Location
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            Added {new Date(vehicle.created_at).toLocaleDateString()}
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          Manage Vehicle
        </Button>
      </div>
    </Card>
  );
};
