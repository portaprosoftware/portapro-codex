
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { FleetLoadManagement } from "@/components/fleet/FleetLoadManagement";

export default function FleetLoadsPage() {
  useEffect(() => {
    document.title = "Fleet Assignments & Loads | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <FleetLoadManagement />
    </FleetLayout>
  );
}
