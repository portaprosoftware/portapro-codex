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
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="logs">All Logs</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
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