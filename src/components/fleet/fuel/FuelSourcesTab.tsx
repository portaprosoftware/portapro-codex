import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelIcon, Container, Truck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FuelTanksManager } from './sources/FuelTanksManager';
import { MobileFuelVendorsManager } from './sources/MobileFuelVendorsManager';
import { RetailStationsManager } from './sources/RetailStationsManager';
import { AddFuelTankDialog } from './sources/AddFuelTankDialog';
import { AddSupplierDialog } from './sources/AddSupplierDialog';
import { AddTankDeliveryDialog } from './sources/AddTankDeliveryDialog';
import { useFuelManagementSettings } from '@/hooks/useFuelManagementSettings';

export const FuelSourcesTab: React.FC = () => {
  const { data: settings } = useFuelManagementSettings();
  const [activeSourceTab, setActiveSourceTab] = useState('retail');
  const [showAddTank, setShowAddTank] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddDelivery, setShowAddDelivery] = useState(false);

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

        {/* Yard Tanks Action Buttons */}
        {settings?.yard_tank_enabled && activeSourceTab === 'tanks' && (
          <div className="flex justify-between items-center mt-6">
            <h3 className="text-lg font-semibold">Fuel Tanks</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddSupplier(true)}>
                <Truck className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
              <Button variant="outline" onClick={() => setShowAddDelivery(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Delivery
              </Button>
              <Button onClick={() => setShowAddTank(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tank
              </Button>
            </div>
          </div>
        )}

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

      <AddFuelTankDialog open={showAddTank} onOpenChange={setShowAddTank} />
      <AddSupplierDialog open={showAddSupplier} onOpenChange={setShowAddSupplier} />
      <AddTankDeliveryDialog open={showAddDelivery} onOpenChange={setShowAddDelivery} />
    </div>
  );
};
