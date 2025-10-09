import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelIcon, Container, Truck } from 'lucide-react';
import { FuelTanksManager } from './sources/FuelTanksManager';
import { MobileFuelVendorsManager } from './sources/MobileFuelVendorsManager';
import { RetailStationsManager } from './sources/RetailStationsManager';
import { useFuelManagementSettings } from '@/hooks/useFuelManagementSettings';

export const FuelSourcesTab: React.FC = () => {
  const { data: settings } = useFuelManagementSettings();
  const [activeSourceTab, setActiveSourceTab] = useState('retail');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Fuel Sources</h3>
        <p className="text-sm text-muted-foreground">
          Manage retail stations, on-site tanks, and mobile fueling vendors
        </p>
      </div>

      <Tabs value={activeSourceTab} onValueChange={setActiveSourceTab} className="w-full">
        <TabsList className={`grid w-full ${
          [settings?.retail_enabled, settings?.yard_tank_enabled, settings?.mobile_service_enabled].filter(Boolean).length === 3 
            ? 'grid-cols-3' 
            : [settings?.retail_enabled, settings?.yard_tank_enabled, settings?.mobile_service_enabled].filter(Boolean).length === 2
            ? 'grid-cols-2'
            : 'grid-cols-1'
        }`}>
          {settings?.retail_enabled && (
            <TabsTrigger value="retail" className="flex items-center gap-2">
              <FuelIcon className="h-4 w-4" />
              Retail Stations
            </TabsTrigger>
          )}
          {settings?.yard_tank_enabled && (
            <TabsTrigger value="tanks" className="flex items-center gap-2">
              <Container className="h-4 w-4" />
              Yard Tanks
            </TabsTrigger>
          )}
          {settings?.mobile_service_enabled && (
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Mobile Vendors
            </TabsTrigger>
          )}
        </TabsList>

        {settings?.retail_enabled && (
          <TabsContent value="retail" className="mt-6">
            <RetailStationsManager />
          </TabsContent>
        )}

        {settings?.yard_tank_enabled && (
          <TabsContent value="tanks" className="mt-6">
            <FuelTanksManager />
          </TabsContent>
        )}

        {settings?.mobile_service_enabled && (
          <TabsContent value="mobile" className="mt-6">
            <MobileFuelVendorsManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
