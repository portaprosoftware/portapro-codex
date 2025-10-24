
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { VehicleAssignments } from "@/components/fleet/VehicleAssignments";

export default function FleetAssignmentsPage() {
  return (
    <FleetLayout>
      <VehicleAssignments />
    </FleetLayout>
  );
}
