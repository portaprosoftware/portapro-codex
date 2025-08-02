
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceAddressesSection } from './ServiceAddressesSection';
import { MapPin, Navigation } from 'lucide-react';

interface ServiceLocationTabProps {
  customerId: string;
}

export function ServiceLocationTab({ customerId }: ServiceLocationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('addresses');

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Service Locations</h3>
        
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Physical Addresses
            </TabsTrigger>
            <TabsTrigger value="coordinates" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              GPS Drop-Pins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="addresses" className="mt-6">
            <ServiceAddressesSection customerId={customerId} />
          </TabsContent>

          <TabsContent value="coordinates" className="mt-6">
            <div className="text-center text-muted-foreground py-8">
              <Navigation className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>GPS Drop-Pins section will be rebuilt here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
