import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  vehicle_type: string;
  year?: number;
  status: string;
  image_url?: string;
}

interface VehicleSelectorProps {
  selectedVehicleId?: string;
  onVehicleSelect: (vehicleId: string) => void;
  className?: string;
  placeholder?: string;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicleId,
  onVehicleSelect,
  className,
  placeholder = "Select vehicle..."
}) => {
  const [open, setOpen] = useState(false);

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

  const getVehicleTypeIcon = (type: string) => {
    // You can customize icons based on vehicle type
    return <Truck className="h-4 w-4" />;
  };

  const getVehicleTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'truck':
        return "text-blue-600";
      case 'van':
        return "text-green-600";
      case 'pickup':
        return "text-orange-600";
      case 'trailer':
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedVehicle ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedVehicle.image_url ? (
                <img 
                  src={selectedVehicle.image_url} 
                  alt={selectedVehicle.license_plate}
                  className="h-6 w-6 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className={cn("h-6 w-6 rounded flex items-center justify-center bg-muted flex-shrink-0", getVehicleTypeColor(selectedVehicle.vehicle_type))}>
                  {getVehicleTypeIcon(selectedVehicle.vehicle_type)}
                </div>
              )}
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-medium truncate">{selectedVehicle.license_plate}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year && `(${selectedVehicle.year})`}
                </span>
              </div>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search vehicles..." />
          <CommandList>
            <CommandEmpty>No vehicle found.</CommandEmpty>
            <CommandGroup>
              {vehicles?.map((vehicle) => (
                <CommandItem
                  key={vehicle.id}
                  value={`${vehicle.license_plate} ${vehicle.make} ${vehicle.model}`}
                  onSelect={() => {
                    onVehicleSelect(vehicle.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {vehicle.image_url ? (
                      <img 
                        src={vehicle.image_url} 
                        alt={vehicle.license_plate}
                        className="h-8 w-8 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={cn("h-8 w-8 rounded flex items-center justify-center bg-muted flex-shrink-0", getVehicleTypeColor(vehicle.vehicle_type))}>
                        {getVehicleTypeIcon(vehicle.vehicle_type)}
                      </div>
                    )}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-medium">{vehicle.license_plate}</span>
                      <span className="text-xs text-muted-foreground">
                        {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                      </span>
                      <span className={cn("text-xs font-medium capitalize", getVehicleTypeColor(vehicle.vehicle_type))}>
                        {vehicle.vehicle_type}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedVehicleId === vehicle.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};