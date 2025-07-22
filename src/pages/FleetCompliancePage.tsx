import React from "react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { FleetCompliance } from "@/components/fleet/FleetCompliance";

export default function FleetCompliancePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <FleetCompliance />
        </div>
      </div>
    </div>
  );
}