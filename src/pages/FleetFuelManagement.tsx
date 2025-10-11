import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { FleetLayout } from '@/components/fleet/FleetLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { FuelOverviewTab } from '@/components/fleet/fuel/FuelOverviewTab';
import { FuelAllLogsTab } from '@/components/fleet/fuel/FuelAllLogsTab';
import { FuelSourcesTab } from '@/components/fleet/fuel/FuelSourcesTab';
import { FuelAnalyticsTab } from '@/components/fleet/fuel/analytics/FuelAnalyticsTab';
import { FuelSettingsTab } from '@/components/fleet/fuel/settings/FuelSettingsTab';
import { FuelLogsActions } from '@/components/fleet/fuel/FuelLogsActions';
import { VehicleContextChip } from '@/components/fleet/VehicleContextChip';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper function to map tab parameter to internal tab value
const getInitialTab = (tabParam: string | null): string => {
  if (tabParam === 'logs' || tabParam === 'all-logs') return 'logs';
  if (tabParam === 'analytics') return 'analytics';
  if (tabParam === 'sources') return 'sources';
  if (tabParam === 'settings') return 'settings';
  return 'overview'; // default
};

export const FleetFuelManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const vehicleId = searchParams.get('vehicle');
  const returnTo = searchParams.get('returnTo');
  const [activeTab, setActiveTab] = useState(getInitialTab(tabParam));
  
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
                <TabsTrigger value="sources" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Fuel Sources</TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Analytics</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Settings</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                {activeTab === 'logs' && <FuelLogsActions />}
                {activeTab === 'reports' && (
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                )}
              </div>
            </div>
          
            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="mt-6">
                <FuelOverviewTab />
              </TabsContent>

              <TabsContent value="logs" className="mt-6">
                <FuelAllLogsTab vehicleId={vehicleId || undefined} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <FuelAnalyticsTab />
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