
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { VehicleCapacityConfig } from "@/components/fleet/VehicleCapacityConfig";

export default function FleetCapacityPage() {
  return (
    <FleetLayout>
      <VehicleCapacityConfig />
    </FleetLayout>
  );
}
