import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleComplianceDocumentsTab } from './VehicleComplianceDocumentsTab';
import { VehicleComplianceSpillKitsTab } from './VehicleComplianceSpillKitsTab';
import { VehicleComplianceIncidentsTab } from './VehicleComplianceIncidentsTab';
import { VehicleComplianceDeconLogsTab } from './VehicleComplianceDeconLogsTab';
import { VehicleComplianceReportsTab } from './VehicleComplianceReportsTab';

interface VehicleComplianceTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleComplianceTab({ vehicleId, licensePlate }: VehicleComplianceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('documents');

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-white rounded-full p-1 shadow-sm border w-full grid grid-cols-5">
          <TabsTrigger 
            value="documents" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold rounded-full text-xs sm:text-sm"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger 
            value="spill-kits" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold rounded-full text-xs sm:text-sm"
          >
            Spill Kits
          </TabsTrigger>
          <TabsTrigger 
            value="incidents" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:font-bold rounded-full text-xs sm:text-sm"
          >
            Incidents
          </TabsTrigger>
          <TabsTrigger 
            value="decon" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold rounded-full text-xs sm:text-sm"
          >
            Decon Logs
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:font-bold rounded-full text-xs sm:text-sm"
          >
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <VehicleComplianceDocumentsTab vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>

        <TabsContent value="spill-kits" className="mt-4">
          <VehicleComplianceSpillKitsTab vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <VehicleComplianceIncidentsTab vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>

        <TabsContent value="decon" className="mt-4">
          <VehicleComplianceDeconLogsTab vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <VehicleComplianceReportsTab vehicleId={vehicleId} licensePlate={licensePlate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
