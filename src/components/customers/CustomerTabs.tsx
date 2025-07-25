
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { CustomerContactsTab } from './CustomerContactsTab';
import { ServiceLocationTab } from './ServiceLocationTab';
import { CustomerJobsTab } from './CustomerJobsTab';
import { CustomerFinancialTab } from './CustomerFinancialTab';
import { CustomerCommunicationTab } from './CustomerCommunicationTab';

interface Customer {
  id: string;
  name: string;
  contact_first_name: string;
  contact_last_name: string;
  type: string;
  email?: string;
  phone?: string;
  service_street: string;
  service_street2?: string;
  service_city: string;
  service_state: string;
  service_zip: string;
  billing_differs_from_service?: boolean;
  billing_street?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  default_service_differs_from_main?: boolean;
  default_service_street?: string;
  default_service_street2?: string;
  default_service_city?: string;
  default_service_state?: string;
  default_service_zip?: string;
  deposit_required?: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  address?: string;
  customer_type?: string;
}

interface CustomerTabsProps {
  customer: Customer;
}

export function CustomerTabs({ customer }: CustomerTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="locations">Service Locations</TabsTrigger>
        <TabsTrigger value="jobs">Jobs</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="communication">Communication</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <CustomerInfoPanel customer={customer} />
      </TabsContent>

      <TabsContent value="contacts" className="mt-6">
        <CustomerContactsTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="locations" className="mt-6">
        <ServiceLocationTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="jobs" className="mt-6">
        <CustomerJobsTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="financial" className="mt-6">
        <CustomerFinancialTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="communication" className="mt-6">
        <CustomerCommunicationTab customerId={customer.id} />
      </TabsContent>
    </Tabs>
  );
}
