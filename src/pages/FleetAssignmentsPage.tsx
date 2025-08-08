
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { VehicleAssignments } from "@/components/fleet/VehicleAssignments";

export default function FleetAssignmentsPage() {
  useEffect(() => {
    document.title = "Driver Assignments | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <VehicleAssignments />
    </FleetLayout>
  );
}
