
import React, { useEffect } from "react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { ComplianceReporting } from "@/components/fleet/ComplianceReporting";

export default function FleetComplianceReportsPage() {
  useEffect(() => {
    document.title = "Compliance Reports | PortaPro";
  }, []);
  return (
    <FleetLayout>
      <ComplianceReporting />
    </FleetLayout>
  );
}
