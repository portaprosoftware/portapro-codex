import React from "react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { ComplianceReporting } from "@/components/fleet/ComplianceReporting";

export default function FleetComplianceReportsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <ComplianceReporting />
      </div>
    </div>
  );
}