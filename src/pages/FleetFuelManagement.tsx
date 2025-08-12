import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FleetLayout } from '@/components/fleet/FleetLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { FuelOverviewTab } from '@/components/fleet/fuel/FuelOverviewTab';
import { FuelAllLogsTab } from '@/components/fleet/fuel/FuelAllLogsTab';
import { FuelReportsTab } from '@/components/fleet/fuel/FuelReportsTab';
import { FuelSettingsTab } from '@/components/fleet/fuel/FuelSettingsTab';

export const FleetFuelManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => {
    document.title = 'Fuel Management | PortaPro';
  }, []);

  return (
    <FleetLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <PageHeader 
            title="Fuel Management" 
            subtitle="Track fuel usage, costs, and efficiency across your fleet"
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center mt-4">
              <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">All Logs</TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Reports</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Settings</TabsTrigger>
              </TabsList>
            </div>
          
            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="mt-6">
                <FuelOverviewTab />
              </TabsContent>

              <TabsContent value="logs" className="mt-6">
                <FuelAllLogsTab />
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <FuelReportsTab />
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <FuelSettingsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </FleetLayout>
  );
};