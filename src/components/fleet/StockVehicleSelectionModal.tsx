import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Vehicle {
  id: string;
  license_plate: string | null;
  vehicle_type?: string | null;
}

interface StockVehicleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onSelectVehicle: (vehicleId: string) => void;
}

export const StockVehicleSelectionModal: React.FC<StockVehicleSelectionModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVehicles = vehicles.filter(vehicle =>
    (vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const handleSelectVehicle = (vehicleId: string) => {
    onSelectVehicle(vehicleId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Select Vehicle
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by license plate or vehicle type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 max-h-96">
            {filteredVehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] bg-white ${
                  selectedVehicleId === vehicle.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleSelectVehicle(vehicle.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {vehicle.license_plate || `Vehicle ${vehicle.id.slice(0, 8)}`}
                        </h4>
                        {vehicle.vehicle_type && (
                          <p className="text-sm text-gray-600">{vehicle.vehicle_type}</p>
                        )}
                      </div>
                    </div>
                    {selectedVehicleId === vehicle.id && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vehicles found matching your search.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};