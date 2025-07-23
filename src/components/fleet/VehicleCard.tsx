
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
  const getStatusClasses = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600 text-white";
      case "maintenance":
        return "bg-yellow-100 text-yellow-700";
      case "retired":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center">
              <Truck className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{vehicle.license_plate}</h3>
              <p className="text-base font-normal text-gray-500">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-sm font-medium text-gray-700 capitalize">{vehicle.vehicle_type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={cn(
              "inline-block text-xs font-medium py-0.5 px-2 rounded-md",
              getStatusClasses(vehicle.status)
            )}>
              {vehicle.status}
            </span>
            <button
              onClick={() => onManage?.(vehicle)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Vehicle Image/Icon Section */}
      <div className="h-32 w-full bg-gray-100 flex items-center justify-center relative">
        <Truck className="w-12 h-12 text-gray-500" />
        <span className={cn(
          "absolute top-2 right-2 inline-block text-xs font-medium py-0.5 px-2 rounded-md",
          getStatusClasses(vehicle.status)
        )}>
          {vehicle.status}
        </span>
      </div>
      
      {/* Vehicle Details */}
      <div className="p-6 space-y-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">{vehicle.license_plate}</h3>
          <p className="text-base font-normal text-gray-500">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-sm font-medium text-gray-700 capitalize">{vehicle.vehicle_type}</p>
        </div>

        <div className="space-y-2">
          {vehicle.current_mileage && (
            <div className="flex items-center text-xs font-normal text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              {vehicle.current_mileage.toLocaleString()} miles
            </div>
          )}
          <div className="flex items-center text-xs font-normal text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            Added {new Date(vehicle.created_at).toLocaleDateString()}
          </div>
        </div>

        <button
          onClick={() => onManage?.(vehicle)}
          className="w-full inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          View Details
        </button>
      </div>
    </div>
  );
};
