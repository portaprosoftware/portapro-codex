import React from "react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { MaintenanceManagement } from "@/components/fleet/MaintenanceManagement";

export default function FleetMaintenancePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <MaintenanceManagement />
        </div>
      </div>
    </div>
  );
}