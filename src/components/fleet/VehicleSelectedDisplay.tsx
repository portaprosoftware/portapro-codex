import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Truck } from "lucide-react";

interface VehicleSelectedDisplayProps {
  vehicleId: string;
  onChangeClick: () => void;
}

export const VehicleSelectedDisplay: React.FC<VehicleSelectedDisplayProps> = ({
  vehicleId,
  onChangeClick,
}) => {
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle-display", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, year, vehicle_type")
        .eq("id", vehicleId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId,
  });

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-16 h-16 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (!vehicle) return null;

  const getVehicleImageUrl = () => {
    // Vehicle images not yet implemented
    return null;
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {getVehicleImageUrl() ? (
              <img
                src={getVehicleImageUrl()!}
                alt={vehicle.license_plate}
                className="w-full h-full object-cover"
              />
            ) : (
              <Truck className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">
              {vehicle.license_plate}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {vehicle.make} {vehicle.model}
              {vehicle.year && ` (${vehicle.year})`}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {vehicle.vehicle_type}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onChangeClick}
        >
          Change
        </Button>
      </div>
    </Card>
  );
};
