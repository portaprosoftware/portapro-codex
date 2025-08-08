import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FleetSidebar } from '@/components/fleet/FleetSidebar';
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
    <div className="flex h-screen bg-background">
      <FleetSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <PageHeader 
                title="Fuel Management" 
                subtitle="Track fuel usage, costs, and efficiency across your fleet"
              />
            </div>
            
            <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logs">All Logs</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

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
            </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};