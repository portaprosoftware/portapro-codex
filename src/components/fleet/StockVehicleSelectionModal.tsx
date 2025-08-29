import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  license_plate: string | null;
  vehicle_type?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vehicle_image?: string | null;
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
    (vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const handleSelectVehicle = (vehicleId: string) => {
    onSelectVehicle(vehicleId);
    onClose();
  };

  // Helper function to get the proper image URL from Supabase storage
  const getVehicleImageUrl = (vehicle: Vehicle) => {
    if (!vehicle.vehicle_image) return null;
    // If it's already a full URL, return as is
    if (vehicle.vehicle_image.startsWith('http')) return vehicle.vehicle_image;
    // Otherwise, use Supabase storage API to get the public URL
    const { data } = supabase.storage.from('vehicle-images').getPublicUrl(vehicle.vehicle_image);
    return data.publicUrl;
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
              placeholder="Search by license plate, vehicle type, make or model..."
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
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    {/* Vehicle Image */}
                    <div className="relative h-32 bg-gray-100 rounded-t-lg overflow-hidden">
                       {getVehicleImageUrl(vehicle) ? (
                         <img 
                           src={getVehicleImageUrl(vehicle)!} 
                           alt={`${vehicle.license_plate} vehicle`}
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             e.currentTarget.nextElementSibling?.classList.remove('hidden');
                           }}
                         />
                       ) : null}
                       <div className={`${getVehicleImageUrl(vehicle) ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200`}>
                         <Truck className="h-8 w-8 text-blue-600" />
                       </div>
                      {selectedVehicleId === vehicle.id && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Vehicle Details */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-lg text-gray-900">
                        {vehicle.license_plate || `Vehicle ${vehicle.id.slice(0, 8)}`}
                      </h4>
                      
                      {(vehicle.make || vehicle.model || vehicle.year) && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Make/Model:</span>
                            <span className="text-sm text-gray-900">
                              {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {vehicle.vehicle_type && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">Type:</span>
                          <span className="text-sm text-gray-900 capitalize">{vehicle.vehicle_type}</span>
                        </div>
                      )}
                    </div>
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