
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { EnhancedMaintenanceManagement } from "@/components/fleet/EnhancedMaintenanceManagement";

export default function FleetMaintenancePage() {
  useEffect(() => {
    document.title = "Fleet Maintenance | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <EnhancedMaintenanceManagement />
    </FleetLayout>
  );
}
