import React, { useState } from 'react';
import { TabNav } from '@/components/ui/TabNav';
import { User, Users, MapPin, Briefcase, DollarSign, MessageSquare, FileText, File, Check, ChevronDown, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CustomerOverviewTab } from './CustomerOverviewTab';
import { CustomerContactsTab } from './CustomerContactsTab';
import { ServiceLocationTab } from './ServiceLocationTab';
import { CustomerJobsTab } from './CustomerJobsTab';
import { CustomerFinancialTab } from './CustomerFinancialTab';
import { CustomerCommunicationTab } from './CustomerCommunicationTab';
import { CustomerJobsAndReportsTab } from './CustomerJobsAndReportsTab';
import { CustomerDocumentsTab } from './CustomerDocumentsTab';
import { CustomerEngagementTab } from './CustomerEngagementTab';

interface Customer {
  id: string;
  name: string;
  customer_type: "events_festivals" | "construction" | "municipal_government" | "private_events_weddings" | "sports_recreation" | "emergency_disaster_relief" | "commercial" | "restaurants" | "retail" | "other" | "not_selected";
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
}

interface CustomerTabsProps {
  customer: Customer;
}

export function CustomerTabs({ customer }: CustomerTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CustomerOverviewTab customer={customer} />;
      case 'contacts':
        return <CustomerContactsTab customerId={customer.id} />;
      case 'locations':
        return <ServiceLocationTab customerId={customer.id} />;
      case 'jobs-reports':
        return <CustomerJobsAndReportsTab customerId={customer.id} />;
      case 'financial':
        return <CustomerFinancialTab customerId={customer.id} />;
      case 'communication':
        return <CustomerCommunicationTab customerId={customer.id} />;
      case 'documents':
        return <CustomerDocumentsTab customerId={customer.id} />;
      case 'engagement':
        return <CustomerEngagementTab customerId={customer.id} />;
      default:
        return <CustomerOverviewTab customer={customer} />;
    }
  };

  const tabOptions = [
    { value: 'overview', label: 'Overview', icon: User },
    { value: 'contacts', label: 'Contacts', icon: Users },
    { value: 'locations', label: 'Service Locations', icon: MapPin },
    { value: 'jobs-reports', label: 'Jobs & Reports', icon: Briefcase },
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'documents', label: 'Documents', icon: File },
    { value: 'engagement', label: 'Engagement', icon: TrendingUp },
  ];

  return (
    <>
      {/* Mobile/Tablet Drawer Navigation (< 1024px) */}
      <div className="mb-6 lg:hidden">
        <Label htmlFor="section-drawer" className="text-sm font-medium mb-2 block">
          Section
        </Label>
        <Drawer>
          <DrawerTrigger asChild>
            <Button 
              id="section-drawer"
              variant="outline" 
              className="w-full justify-between h-11 text-base"
            >
              <div className="flex items-center gap-2">
                {(() => {
                  const currentTab = tabOptions.find(opt => opt.value === activeTab);
                  const Icon = currentTab?.icon || User;
                  return (
                    <>
                      <Icon className="w-5 h-5" />
                      <span>{currentTab?.label || 'Select section'}</span>
                    </>
                  );
                })()}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[75vh]">
            <DrawerHeader className="border-b">
              <DrawerTitle className="text-lg">Section</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-4">
              <div className="space-y-1">
                {tabOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DrawerTrigger key={option.value} asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-12 text-base font-normal ${
                          activeTab === option.value ? 'bg-accent' : ''
                        }`}
                        onClick={() => setActiveTab(option.value)}
                      >
                        <Check className={`mr-2 h-5 w-5 ${activeTab === option.value ? 'opacity-100' : 'opacity-0'}`} />
                        <Icon className="w-5 h-5 mr-2" />
                        {option.label}
                      </Button>
                    </DrawerTrigger>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop Tab Navigation (>= 1024px) */}
      <div className="hidden lg:block">
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
            to="#jobs-reports" 
            isActive={activeTab === 'jobs-reports'}
            onClick={() => setActiveTab('jobs-reports')}
          >
            <Briefcase className="w-4 h-4" />
            Jobs & Reports
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
          <TabNav.Item 
            to="#documents" 
            isActive={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
          >
            <File className="w-4 h-4" />
            Documents
          </TabNav.Item>
          <TabNav.Item 
            to="#engagement" 
            isActive={activeTab === 'engagement'}
            onClick={() => setActiveTab('engagement')}
          >
            <TrendingUp className="w-4 h-4" />
            Engagement
          </TabNav.Item>
        </TabNav>
      </div>

      {/* Active Tab Content */}
      <div className="mt-6">
        {renderActiveTabContent()}
      </div>
    </>
  );
}

// Export the navigation component separately so it can be used in the header
export function CustomerTabNavigation({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void 
}) {
  const tabOptions = [
    { value: 'overview', label: 'Overview', icon: User },
    { value: 'contacts', label: 'Contacts', icon: Users },
    { value: 'locations', label: 'Service Locations', icon: MapPin },
    { value: 'jobs-reports', label: 'Jobs & Reports', icon: Briefcase },
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'documents', label: 'Documents', icon: File },
    { value: 'engagement', label: 'Engagement', icon: TrendingUp },
  ];

  return (
    <>
      {/* Mobile/Tablet Drawer Navigation (< 1024px) */}
      <div className="lg:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between h-11 text-base"
            >
              <div className="flex items-center gap-2">
                {(() => {
                  const currentTab = tabOptions.find(opt => opt.value === activeTab);
                  const Icon = currentTab?.icon || User;
                  return (
                    <>
                      <Icon className="w-5 h-5" />
                      <span>{currentTab?.label || 'Select section'}</span>
                    </>
                  );
                })()}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[75vh]">
            <DrawerHeader className="border-b">
              <DrawerTitle className="text-lg">Section</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-4">
              <div className="space-y-1">
                {tabOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DrawerTrigger key={option.value} asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-12 text-base font-normal ${
                          activeTab === option.value ? 'bg-accent' : ''
                        }`}
                        onClick={() => onTabChange(option.value)}
                      >
                        <Check className={`mr-2 h-5 w-5 ${activeTab === option.value ? 'opacity-100' : 'opacity-0'}`} />
                        <Icon className="w-5 h-5 mr-2" />
                        {option.label}
                      </Button>
                    </DrawerTrigger>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop Tab Navigation (>= 1024px) */}
      <div className="hidden lg:block">
        <TabNav ariaLabel="Customer sections">
          <TabNav.Item 
            to="#overview" 
            isActive={activeTab === 'overview'}
            onClick={() => onTabChange('overview')}
          >
            <User className="w-4 h-4" />
            Overview
          </TabNav.Item>
          <TabNav.Item 
            to="#contacts" 
            isActive={activeTab === 'contacts'}
            onClick={() => onTabChange('contacts')}
          >
            <Users className="w-4 h-4" />
            Contacts
          </TabNav.Item>
          <TabNav.Item 
            to="#locations" 
            isActive={activeTab === 'locations'}
            onClick={() => onTabChange('locations')}
          >
            <MapPin className="w-4 h-4" />
            Service Locations
          </TabNav.Item>
          <TabNav.Item 
            to="#jobs-reports" 
            isActive={activeTab === 'jobs-reports'}
            onClick={() => onTabChange('jobs-reports')}
          >
            <Briefcase className="w-4 h-4" />
            Jobs & Reports
          </TabNav.Item>
          <TabNav.Item 
            to="#financial" 
            isActive={activeTab === 'financial'}
            onClick={() => onTabChange('financial')}
          >
            <DollarSign className="w-4 h-4" />
            Financial
          </TabNav.Item>
          <TabNav.Item 
            to="#communication" 
            isActive={activeTab === 'communication'}
            onClick={() => onTabChange('communication')}
          >
            <MessageSquare className="w-4 h-4" />
            Communication
          </TabNav.Item>
          <TabNav.Item 
            to="#documents" 
            isActive={activeTab === 'documents'}
            onClick={() => onTabChange('documents')}
          >
            <File className="w-4 h-4" />
            Documents
          </TabNav.Item>
          <TabNav.Item 
            to="#engagement" 
            isActive={activeTab === 'engagement'}
            onClick={() => onTabChange('engagement')}
          >
            <TrendingUp className="w-4 h-4" />
            Engagement
          </TabNav.Item>
        </TabNav>
      </div>
    </>
  );
}
