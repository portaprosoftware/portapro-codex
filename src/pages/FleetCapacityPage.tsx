import React from "react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { VehicleCapacityConfig } from "@/components/fleet/VehicleCapacityConfig";

export default function FleetCapacityPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <VehicleCapacityConfig />
      </div>
    </div>
  );
}