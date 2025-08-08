
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { FleetCompliance } from "@/components/fleet/FleetCompliance";

export default function FleetCompliancePage() {
  useEffect(() => {
    document.title = "Transport & Spill Compliance | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <FleetCompliance />
    </FleetLayout>
  );
}
