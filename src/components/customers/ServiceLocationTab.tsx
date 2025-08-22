
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceAddressesSection } from './ServiceAddressesSection';
import { MapPin, Navigation } from 'lucide-react';

interface ServiceLocationTabProps {
  customerId: string;
}

const DropMapPinsSection = ({ customerId }: { customerId: string }) => {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Drop Map Pins</h3>
        <p className="text-muted-foreground">
          This section is for reference only and will display custom map pin locations.
        </p>
      </div>
    </div>
  );
};

export function ServiceLocationTab({ customerId }: ServiceLocationTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Service Locations</h3>
        
        <Tabs defaultValue="addresses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Physical Addresses
            </TabsTrigger>
            <TabsTrigger value="pins" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Drop Map Pins
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="addresses" className="mt-6">
            <ServiceAddressesSection customerId={customerId} />
          </TabsContent>
          
          <TabsContent value="pins" className="mt-6">
            <DropMapPinsSection customerId={customerId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
