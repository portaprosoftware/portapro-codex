
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { CustomerNotesPanel } from './CustomerNotesPanel';
import { CustomerContactsTab } from './CustomerContactsTab';
import { ServiceLocationTab } from './ServiceLocationTab';
import { CustomerJobsTab } from './CustomerJobsTab';
import { CustomerFinancialTab } from './CustomerFinancialTab';
import { CustomerCommunicationTab } from './CustomerCommunicationTab';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  customer_type?: string;
  created_at: string;
  updated_at: string;
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <CustomerInfoPanel customer={customer} />
          </div>
          <div className="lg:col-span-1">
            <CustomerNotesPanel customerId={customer.id} />
          </div>
        </div>
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
