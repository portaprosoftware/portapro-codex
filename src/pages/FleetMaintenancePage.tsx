
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { EnhancedMaintenanceManagement } from "@/components/fleet/EnhancedMaintenanceManagement";
import { VehicleContextChip } from "@/components/fleet/VehicleContextChip";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function FleetMaintenancePage() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicle');
  const returnTo = searchParams.get('returnTo');
  
  useEffect(() => {
    document.title = "Fleet Maintenance | PortaPro";
  }, []);

  // Fetch vehicle details if vehicleId is present
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId,
  });

  return (
    <FleetLayout>
      {/* Vehicle Context Chip */}
      {vehicle && (
        <div className="mb-4">
          <VehicleContextChip
            vehicleId={vehicle.id}
            vehicleName={vehicle.license_plate}
            returnTo={returnTo || undefined}
          />
        </div>
      )}
      
      <EnhancedMaintenanceManagement />
    </FleetLayout>
  );
}
