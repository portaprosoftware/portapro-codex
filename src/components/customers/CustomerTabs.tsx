
import React, { useState } from 'react';
import { TabNav } from '@/components/ui/TabNav';
import { User, Users, MapPin, Briefcase, DollarSign, MessageSquare } from 'lucide-react';
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

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CustomerInfoPanel customer={customer} />;
      case 'contacts':
        return <CustomerContactsTab customerId={customer.id} />;
      case 'locations':
        return <ServiceLocationTab customerId={customer.id} />;
      case 'jobs':
        return <CustomerJobsTab customerId={customer.id} />;
      case 'financial':
        return <CustomerFinancialTab customerId={customer.id} />;
      case 'communication':
        return <CustomerCommunicationTab customerId={customer.id} />;
      default:
        return <CustomerInfoPanel customer={customer} />;
    }
  };

  return (
    <div className="w-full">
      {/* Customer Navigation Pills */}
      <div className="mb-6">
        <TabNav ariaLabel="Customer sections">
          <TabNav.Item 
            to="#overview" 
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            <User className="w-4 h-4" />
            Overview
          </TabNav.Item>
          <TabNav.Item 
            to="#contacts" 
            isActive={activeTab === 'contacts'}
            onClick={() => setActiveTab('contacts')}
          >
            <Users className="w-4 h-4" />
            Contacts
          </TabNav.Item>
          <TabNav.Item 
            to="#locations" 
            isActive={activeTab === 'locations'}
            onClick={() => setActiveTab('locations')}
          >
            <MapPin className="w-4 h-4" />
            Service Locations
          </TabNav.Item>
          <TabNav.Item 
            to="#jobs" 
            isActive={activeTab === 'jobs'}
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase className="w-4 h-4" />
            Jobs
          </TabNav.Item>
          <TabNav.Item 
            to="#financial" 
            isActive={activeTab === 'financial'}
            onClick={() => setActiveTab('financial')}
          >
            <DollarSign className="w-4 h-4" />
            Financial
          </TabNav.Item>
          <TabNav.Item 
            to="#communication" 
            isActive={activeTab === 'communication'}
            onClick={() => setActiveTab('communication')}
          >
            <MessageSquare className="w-4 h-4" />
            Communication
          </TabNav.Item>
        </TabNav>
      </div>

      {/* Active Tab Content */}
      <div className="mt-6">
        {renderActiveTabContent()}
      </div>
    </div>
  );
}
