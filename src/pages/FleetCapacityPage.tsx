
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { VehicleCapacityConfig } from "@/components/fleet/VehicleCapacityConfig";

export default function FleetCapacityPage() {
  useEffect(() => {
    document.title = "Fleet Capacity | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <VehicleCapacityConfig />
    </FleetLayout>
  );
}
