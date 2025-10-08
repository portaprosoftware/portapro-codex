import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelIcon, Warehouse, Truck } from 'lucide-react';
import { FuelTanksManager } from './sources/FuelTanksManager';
import { MobileFuelVendorsManager } from './sources/MobileFuelVendorsManager';
import { RetailStationsManager } from './sources/RetailStationsManager';

export const FuelSourcesTab: React.FC = () => {
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
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="retail" className="flex items-center gap-2">
            <FuelIcon className="h-4 w-4" />
            Retail Stations
          </TabsTrigger>
          <TabsTrigger value="tanks" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Yard Tanks
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Mobile Vendors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="retail" className="mt-6">
          <RetailStationsManager />
        </TabsContent>

        <TabsContent value="tanks" className="mt-6">
          <FuelTanksManager />
        </TabsContent>

        <TabsContent value="mobile" className="mt-6">
          <MobileFuelVendorsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
