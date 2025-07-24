
import React from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { FleetOverview } from "@/components/fleet/FleetOverview";

export default function FleetManagement() {
  return (
    <FleetLayout>
      <FleetOverview />
    </FleetLayout>
  );
}
