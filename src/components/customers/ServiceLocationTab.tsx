
import React from 'react';
import { ServiceAddressesSection } from './ServiceAddressesSection';

interface ServiceLocationTabProps {
  customerId: string;
}

export function ServiceLocationTab({ customerId }: ServiceLocationTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Service Locations</h3>
        <ServiceAddressesSection customerId={customerId} />
      </div>
    </div>
  );
}
