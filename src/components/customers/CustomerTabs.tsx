
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { CustomerNotesPanel } from './CustomerNotesPanel';
import { CustomerContactsTab } from './CustomerContactsTab';

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
        <div className="bg-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Service Locations</h3>
          <p className="text-muted-foreground">Service location management coming soon...</p>
        </div>
      </TabsContent>

      <TabsContent value="jobs" className="mt-6">
        <div className="bg-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Job History</h3>
          <p className="text-muted-foreground">Job history coming soon...</p>
        </div>
      </TabsContent>

      <TabsContent value="financial" className="mt-6">
        <div className="bg-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Financial Records</h3>
          <p className="text-muted-foreground">Financial records coming soon...</p>
        </div>
      </TabsContent>

      <TabsContent value="communication" className="mt-6">
        <div className="bg-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Communication History</h3>
          <p className="text-muted-foreground">Communication history coming soon...</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
