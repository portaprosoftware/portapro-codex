
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FleetOverview } from "@/components/fleet/FleetOverview";
import { FleetCompliance } from "@/components/fleet/FleetCompliance";
import { VehicleAssignments } from "@/components/fleet/VehicleAssignments";
import { MaintenanceManagement } from "@/components/fleet/MaintenanceManagement";

export default function FleetManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-1">Manage vehicles & operations</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FleetOverview />
        </TabsContent>
        
        <TabsContent value="compliance">
          <FleetCompliance />
        </TabsContent>
        
        <TabsContent value="assignments">
          <VehicleAssignments />
        </TabsContent>
        
        <TabsContent value="maintenance">
          <MaintenanceManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
