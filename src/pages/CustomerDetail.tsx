import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { CustomerStatsSection } from '@/components/customers/CustomerStatsSection';
import { CustomerTabNavigation } from '@/components/customers/CustomerTabs';
import { CustomerOverviewTab } from '@/components/customers/CustomerOverviewTab';
import { CustomerContactsTab } from '@/components/customers/CustomerContactsTab';
import { ServiceLocationTab } from '@/components/customers/ServiceLocationTab';
import { CustomerJobsAndReportsTab } from '@/components/customers/CustomerJobsAndReportsTab';
import { CustomerFinancialTab } from '@/components/customers/CustomerFinancialTab';
import { CustomerCommunicationTab } from '@/components/customers/CustomerCommunicationTab';
import { CustomerDocumentsTab } from '@/components/customers/CustomerDocumentsTab';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { formatPhoneNumber } from '@/lib/utils';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer || !id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-foreground mb-4">Customer not found</h1>
        <Link to="/customer-hub">
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-md border-0">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Customer Hub
          </Button>
        </Link>
      </div>
    );
  }

  const getCustomerTypeColor = (type?: string) => {
    const typeGradients = {
      'bars_restaurants': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 font-bold',
      'construction': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 font-bold',
      'emergency_disaster_relief': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 font-bold',
      'events_festivals': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 font-bold',
      'municipal_government': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-bold',
      'other': 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-bold',
      'private_events_weddings': 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 font-bold',
      'retail': 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0 font-bold',
      'sports_recreation': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-bold',
      'commercial': 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0 font-bold'
    };
    return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-bold';
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-none px-2 md:px-4 py-6 space-y-6">
        {/* Header Card with Customer Info and Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pb-4">
          {/* Top Row: Back Button, Breadcrumb, and Customer Name */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            {/* Left side: Back Button, Breadcrumb and Customer Name */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumb with Back Button */}
              <div className="flex items-center gap-2 mb-2">
                <Link to="/customer-hub">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold border-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Customer List
                  </Button>
                </Link>
                <Breadcrumb>
                  <BreadcrumbList className="text-sm">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/customer-hub">Customer Hub</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{customer.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              
              {/* Customer name */}
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {customer.name}
              </h1>
            </div>
          </div>
          
          {/* Customer metadata */}
          <div className="flex flex-wrap items-center gap-2 text-base mb-6">
            <Badge className={getCustomerTypeColor(customer.customer_type)}>
              {formatCategoryDisplay((customer as any).type || customer.customer_type || 'Customer')}
            </Badge>
            
            {customer.email && (
              <a 
                href={`mailto:${customer.email}`}
                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                onClick={(e) => {
                  // Ensure the link works by not preventing default
                  console.log('Email clicked:', customer.email);
                }}
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </a>
            )}
            
            {customer.phone && (
              <a 
                href={`tel:${customer.phone}`}
                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                onClick={(e) => {
                  // Ensure the link works by not preventing default
                  console.log('Phone clicked:', customer.phone);
                }}
              >
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatPhoneNumber(customer.phone)}</span>
              </a>
            )}
          </div>
          
          {/* Tab Navigation at bottom of header card */}
          <div className="border-t pt-4 mt-2">
            <CustomerTabNavigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pb-4">
          <CustomerStatsSection customerId={id!} />
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {activeTab === 'overview' && <CustomerOverviewTab customer={{
            ...customer,
            customer_type: customer.customer_type as any || 'not_selected',
            service_street: (customer as any).service_street || customer.address?.split(',')[0] || '',
            service_street2: (customer as any).service_street2 || '',
            service_city: (customer as any).service_city || customer.address?.split(',')[1]?.trim() || '',
            service_state: (customer as any).service_state || customer.address?.split(',')[2]?.trim() || '',
            service_zip: (customer as any).service_zip || customer.address?.split(',')[3]?.trim() || '',
          }} />}
          {activeTab === 'contacts' && <CustomerContactsTab customerId={id!} />}
          {activeTab === 'locations' && <ServiceLocationTab customerId={id!} />}
          {activeTab === 'jobs-reports' && <CustomerJobsAndReportsTab customerId={id!} />}
          {activeTab === 'financial' && <CustomerFinancialTab customerId={id!} />}
          {activeTab === 'communication' && <CustomerCommunicationTab customerId={id!} />}
          {activeTab === 'documents' && <CustomerDocumentsTab customerId={id!} />}
        </div>
      </div>
    </div>
  );
}