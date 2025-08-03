
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
        <ServiceAddressesSection customerId={customerId} />
      </div>
    </div>
  );
}
