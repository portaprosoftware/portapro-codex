
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { FleetLoadManagement } from "@/components/fleet/FleetLoadManagement";

export default function FleetLoadsPage() {
  return (
    <FleetLayout>
      <FleetLoadManagement />
    </FleetLayout>
  );
}
