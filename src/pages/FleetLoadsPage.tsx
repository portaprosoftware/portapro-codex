import React from "react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { FleetLoadManagement } from "@/components/fleet/FleetLoadManagement";

export default function FleetLoadsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <FleetLoadManagement />
        </div>
      </div>
    </div>
  );
}