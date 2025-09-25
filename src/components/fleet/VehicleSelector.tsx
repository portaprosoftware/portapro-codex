import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Truck, Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  vehicle_type: string;
  year?: number;
  status: string;
}

interface VehicleSelectorProps {
  selectedVehicleId?: string;
  onVehicleSelect: (vehicleId: string) => void;
  showAddButton?: boolean;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicleId,
  onVehicleSelect,
  showAddButton = false,
  className,
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If used as a modal (isOpen and onClose props provided), use those instead of internal state
  const modalOpen = isOpen !== undefined ? isOpen : isModalOpen;
  const handleModalClose = onClose || (() => setIsModalOpen(false));

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, vehicle_type, year, status")
        .eq("status", "active")
        .order("license_plate");
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);

  const filteredVehicles = vehicles?.filter(vehicle => {
    const searchLower = searchQuery.toLowerCase();
    return (
      vehicle.license_plate.toLowerCase().includes(searchLower) ||
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.vehicle_type.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleVehicleSelect = (vehicleId: string) => {
    onVehicleSelect(vehicleId);
    if (onClose) {
      onClose();
    } else {
      setIsModalOpen(false);
    }
  };

  const getVehicleTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'truck':
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case 'van':
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case 'pickup':
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case 'trailer':
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const formatVehicleType = (type: string) => {
    return type.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label>Select Vehicle</Label>
        {showAddButton && (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        )}
      </div>

      {/* Selected Vehicle Display */}
      {selectedVehicle ? (
        <Card className="p-4 border-blue-500 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {selectedVehicle.license_plate}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{selectedVehicle.make} {selectedVehicle.model}</span>
                  {selectedVehicle.year && (
                    <span>• {selectedVehicle.year}</span>
                  )}
                </div>
                <Badge className={cn(getVehicleTypeColor(selectedVehicle.vehicle_type))}>
                  {formatVehicleType(selectedVehicle.vehicle_type)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                Change
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-dashed border-2 border-gray-300">
          <div className="text-center py-6">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicle selected</h3>
            <p className="text-gray-600 mb-4">Choose a vehicle to add compliance documents</p>
            <Button onClick={() => setIsModalOpen(true)}>
              Select Vehicle
            </Button>
          </div>
        </Card>
      )}

      {/* Vehicle Selection Modal */}
      <Dialog open={modalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Vehicle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by license plate, make, model, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Vehicle List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
                  <p className="text-gray-600">Try adjusting your search terms</p>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className={cn(
                      "p-4 cursor-pointer hover:shadow-md transition-shadow",
                      selectedVehicleId === vehicle.id && "border-blue-500 bg-blue-50"
                    )}
                    onClick={() => handleVehicleSelect(vehicle.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {vehicle.license_plate}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{vehicle.make} {vehicle.model}</span>
                          {vehicle.year && (
                            <span>• {vehicle.year}</span>
                          )}
                        </div>
                        <Badge className={cn("mt-1", getVehicleTypeColor(vehicle.vehicle_type))}>
                          {formatVehicleType(vehicle.vehicle_type)}
                        </Badge>
                      </div>
                      {selectedVehicleId === vehicle.id && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};