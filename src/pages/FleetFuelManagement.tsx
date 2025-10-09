import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FleetLayout } from '@/components/fleet/FleetLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { FuelOverviewTab } from '@/components/fleet/fuel/FuelOverviewTab';

import { FuelAllLogsTab } from '@/components/fleet/fuel/FuelAllLogsTab';
import { FuelReportsTab } from '@/components/fleet/fuel/FuelReportsTab';
import { FuelSourcesTab } from '@/components/fleet/fuel/FuelSourcesTab';
import { FuelSupplyTab } from '@/components/fleet/fuel/supply/FuelSupplyTab';
import { FuelAnalyticsTab } from '@/components/fleet/fuel/analytics/FuelAnalyticsTab';
import { FuelSettingsTab } from '@/components/fleet/fuel/settings/FuelSettingsTab';
import { FuelLogsActions } from '@/components/fleet/fuel/FuelLogsActions';
import { VehicleContextChip } from '@/components/fleet/VehicleContextChip';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const FleetFuelManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicle');
  const returnTo = searchParams.get('returnTo');
  
  useEffect(() => {
    document.title = 'Fuel Management | PortaPro';
  }, []);

  // Fetch vehicle details if vehicleId is present
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId,
  });

  return (
    <FleetLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          {/* Vehicle Context Chip */}
          {vehicle && (
            <div className="mb-4">
              <VehicleContextChip
                vehicleId={vehicle.id}
                vehicleName={vehicle.license_plate}
                returnTo={returnTo || undefined}
              />
            </div>
          )}
          
          <PageHeader 
            title="Fuel Management" 
            subtitle="Track fuel usage, costs, and efficiency across your fleet"
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mt-4 gap-4">
              <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Overview</TabsTrigger>
                
                <TabsTrigger value="logs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">All Logs</TabsTrigger>
                <TabsTrigger value="supply" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Supply</TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Analytics</TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Reports</TabsTrigger>
                <TabsTrigger value="sources" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Fuel Sources</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Settings</TabsTrigger>
              </TabsList>
              
              {activeTab === 'logs' && (
                <FuelLogsActions />
              )}
            </div>
          
            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="mt-6">
                <FuelOverviewTab />
              </TabsContent>


              <TabsContent value="logs" className="mt-6">
                <FuelAllLogsTab />
              </TabsContent>

              <TabsContent value="supply" className="mt-6">
                <FuelSupplyTab />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <FuelAnalyticsTab />
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <FuelReportsTab />
              </TabsContent>

              <TabsContent value="sources" className="mt-6">
                <FuelSourcesTab />
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