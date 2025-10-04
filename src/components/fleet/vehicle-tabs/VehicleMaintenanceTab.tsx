import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleMaintenanceOverviewTab } from "./VehicleMaintenanceOverviewTab";
import { MaintenanceAllRecordsTab } from "../MaintenanceAllRecordsTab";
import { DVIRList } from "../DVIRList";
import { WorkOrdersBoard } from "../WorkOrdersBoard";
import { PMSchedulesTab } from "../PMSchedulesTab";

interface VehicleMaintenanceTabProps {
  vehicleId: string | null;
  licensePlate: string;
}

export const VehicleMaintenanceTab: React.FC<VehicleMaintenanceTabProps> = ({
  vehicleId,
  licensePlate
}) => {
  if (!vehicleId) {
    return (
      <div className="text-center py-8 text-gray-500">
        No vehicle selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="records" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap"
          >
            All Records
          </TabsTrigger>
          <TabsTrigger 
            value="dvir" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap"
          >
            DVIR
          </TabsTrigger>
          <TabsTrigger 
            value="pm" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap"
          >
            PM Schedules
          </TabsTrigger>
          <TabsTrigger 
            value="workorders" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap"
          >
            Work Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <VehicleMaintenanceOverviewTab 
            vehicleId={vehicleId} 
            licensePlate={licensePlate} 
          />
        </TabsContent>

        <TabsContent value="records">
          <MaintenanceAllRecordsTab vehicleId={vehicleId} />
        </TabsContent>

        <TabsContent value="dvir">
          <DVIRList vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>

        <TabsContent value="pm">
          <PMSchedulesTab vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>

        <TabsContent value="workorders">
          <WorkOrdersBoard vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
