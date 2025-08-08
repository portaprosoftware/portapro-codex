
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { FleetOverview } from "@/components/fleet/FleetOverview";

export default function FleetManagement() {
  useEffect(() => {
    document.title = "Fleet Overview | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <FleetOverview />
    </FleetLayout>
  );
}
