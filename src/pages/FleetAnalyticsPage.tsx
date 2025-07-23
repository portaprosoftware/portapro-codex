import React from "react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { FleetAnalytics } from "@/components/fleet/FleetAnalytics";

export default function FleetAnalyticsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <FleetAnalytics />
      </div>
    </div>
  );
}