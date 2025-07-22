import React from "react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { VehicleAssignments } from "@/components/fleet/VehicleAssignments";

export default function FleetAssignmentsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <VehicleAssignments />
        </div>
      </div>
    </div>
  );
}