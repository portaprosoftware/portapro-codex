import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Truck, Search, Calendar, CheckCircle, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  license_plate: string | null;
  vehicle_type?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  status?: string | null;
  vehicle_image?: string | null;
}

interface VehicleFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedVehicle?: any;
  onVehicleSelect: (vehicle: any) => void;
}

export const VehicleFilterModal: React.FC<VehicleFilterModalProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedVehicle,
  onVehicleSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles-all-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .in("status", ["available", "maintenance", "permanently_retired"])
        .order("license_plate", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open, // Only fetch when modal is open
  });

  // Filter vehicles based on search term and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      (vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Filter Vehicles
          </DialogTitle>
          <DialogDescription>
            Filter vehicles by status and search criteria. Use the tabs to view available, maintenance, or retired vehicles.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex gap-1">
              {[
                { value: "all", label: "All Vehicles" },
                { value: "available", label: "Available" },
                { value: "maintenance", label: "Maintenance" },
                { value: "permanently_retired", label: "Retired" }
              ].map((status) => (
                <Button
                  key={status.value}
                  variant={statusFilter === status.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(status.value)}
                  className="text-xs"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by license plate, vehicle type, make or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Date Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>Filtering maintenance records for vehicle selection</span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading vehicles...</p>
            </div>
          )}

          {/* Vehicle Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 max-h-96 pb-16">
              {filteredVehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                    selectedVehicle?.id === vehicle.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectVehicle(vehicle)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {/* Vehicle Image */}
                      <div className="relative h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg overflow-hidden">
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
                        <div className={`${getVehicleImageUrl(vehicle) ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                          <Truck className="h-8 w-8 text-blue-600" />
                        </div>
                        {selectedVehicle?.id === vehicle.id && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white font-bold border-0 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
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
                            <span className="text-sm text-gray-600 font-medium">Make/Model:</span>
                            <p className="text-sm text-gray-900 leading-tight">
                              {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
                            </p>
                          </div>
                        )}
                        
                        {vehicle.vehicle_type && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Type:</span>
                            <span className="text-sm text-gray-900 capitalize">{vehicle.vehicle_type}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">Status:</span>
                          <Badge 
                            variant="outline" 
                            className={
                              vehicle.status === "available" 
                                ? "text-green-600 border-green-600" 
                                : vehicle.status === "maintenance"
                                ? "text-yellow-600 border-yellow-600"
                                : "text-red-600 border-red-600"
                            }
                          >
                            {vehicle.status === "available" 
                              ? "Available" 
                              : vehicle.status === "maintenance"
                              ? "Maintenance"
                              : "Retired"
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Spacer blank card to allow scrolling past last row */}
              <Card key="spacer" className="col-span-full bg-white border pointer-events-none select-none">
                <CardContent className="h-16" />
              </Card>
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredVehicles.length === 0 && vehicles.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vehicles found matching your search.</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* No Vehicles Available */}
          {!isLoading && vehicles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vehicles available for assignment.</p>
              <p className="text-sm mt-1">Please add vehicles to your fleet first.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} available
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {selectedVehicle && (
              <Button onClick={() => handleSelectVehicle(selectedVehicle)}>
                Confirm Selection
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
