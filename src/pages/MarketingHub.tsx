
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, MessageCircle, TrendingUp, Plus } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { TemplateManagement } from '@/components/marketing/TemplateManagement';
import { CampaignCreation } from '@/components/marketing/CampaignCreation';
import { SmartSegmentBuilder } from '@/components/marketing/SmartSegmentBuilder';
import { CampaignAnalytics } from '@/components/marketing/CampaignAnalytics';
import { CustomerTypeCard } from '@/components/CustomerTypeCard';

const CUSTOMER_TYPES = {
  "events_festivals": { label: "Events & Festivals", color: "#8A2BE2" },
  "sports_recreation": { label: "Sports & Recreation", color: "#33CC66" },
  "municipal_government": { label: "Municipal & Government", color: "#3366FF" },
  "private_events_weddings": { label: "Private Events & Weddings", color: "#CC3366" },
  "construction": { label: "Construction", color: "#FF6600" },
  "commercial": { label: "Commercial", color: "#4A4A4A" },
  "emergency_disaster_relief": { label: "Emergency & Disaster Relief", color: "#CC3333" }
};

const MarketingHub: React.FC = () => {
  const { hasAdminAccess } = useUserRole();
  const [activeTab, setActiveTab] = useState('customer-segments');

  // Redirect if no admin access
  if (!hasAdminAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch customer counts
  const { data: customerCounts } = useQuery({
    queryKey: ['customer-counts'],
    queryFn: async () => {
      const { data: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact' });

      const { data: emailContacts } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .not('email', 'is', null)
        .neq('email', '');

      const { data: smsContacts } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .not('phone', 'is', null)
        .neq('phone', '');

      const { data: bothContacts } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .not('email', 'is', null)
        .neq('email', '')
        .not('phone', 'is', null)
        .neq('phone', '');

      return {
        total: totalCustomers?.length || 0,
        email: emailContacts?.length || 0,
        sms: smsContacts?.length || 0,
        both: bothContacts?.length || 0
      };
    }
  });

  // Fetch smart segments
  const { data: segments } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Fetch customers for breakdown
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Fetch customer type counts
  const { data: customerTypes } = useQuery({
    queryKey: ['customer-type-counts'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_customer_type_counts');
      return data || [];
    }
  });

  // Calculate customer type breakdown using CustomerTypeCard format
  const customerTypeBreakdown = useMemo(() => {
    if (!customers) return [];
    const breakdown = Object.keys(CUSTOMER_TYPES).map(type => {
      const typeCustomers = customers.filter(c => c.customer_type === type);
      return {
        type,
        ...CUSTOMER_TYPES[type as keyof typeof CUSTOMER_TYPES],
        count: typeCustomers.length,
        email: Math.floor(typeCustomers.length * 0.6), // Mock data
        sms: Math.floor(typeCustomers.length * 0.3), // Mock data
        both: Math.floor(typeCustomers.length * 0.1) // Mock data
      };
    });
    return breakdown;
  }, [customers]);

  const tabs = [
    { id: 'customer-segments', label: 'Customer Segments' },
    { id: 'campaign-analytics', label: 'Campaign Analytics' },
    { id: 'campaign-history', label: 'Campaign History' },
    { id: 'scheduled-campaigns', label: 'Scheduled Campaigns' },
    { id: 'manage-templates', label: 'Manage Templates' },
    { id: 'create-campaign', label: 'Create Campaign' }
  ];

  const summaryCards = [
    {
      title: 'Total Customers',
      value: customerCounts?.total || 0,
      icon: User,
      color: 'hsl(var(--primary))'
    },
    {
      title: 'Email Contacts',
      value: customerCounts?.email || 0,
      icon: Mail,
      color: 'hsl(142, 71%, 45%)'
    },
    {
      title: 'SMS Contacts',
      value: customerCounts?.sms || 0,
      icon: MessageCircle,
      color: 'hsl(259, 55%, 52%)'
    },
    {
      title: 'Both Methods',
      value: customerCounts?.both || 0,
      icon: TrendingUp,
      color: 'hsl(25, 95%, 53%)'
    }
  ];

  const getCustomerTypeColor = (type: string) => {
    const colors = {
      'construction': 'hsl(259, 55%, 52%)',
      'events': 'hsl(259, 55%, 52%)',
      'sports': 'hsl(142, 71%, 45%)',
      'residential': 'hsl(25, 95%, 53%)',
      'commercial': 'hsl(221, 83%, 53%)',
      'emergency': 'hsl(0, 84%, 60%)',
    };
    return colors[type as keyof typeof colors] || 'hsl(var(--primary))';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Marketing Hub</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Manage customer segments, campaigns, and communications</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-10 py-4 rounded-lg font-medium text-sm transition-colors whitespace-nowrap min-w-fit ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-sm border-0'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Customer Segments Tab */}
        {activeTab === 'customer-segments' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card, index) => (
                <Card key={index} className="p-6 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                      <p className="text-2xl font-bold" style={{ color: card.color }}>
                        {card.value}
                      </p>
                    </div>
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: card.color }}
                    >
                      <card.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Smart Segments Section */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Smart Segments</h2>
                  <p className="text-sm text-gray-600">Dynamic segments that update automatically based on customer data</p>
                </div>
                <SmartSegmentBuilder />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments?.map((segment) => (
                  <Card key={segment.id} className="p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-50 text-primary border-0"
                      >
                        Smart
                      </Badge>
                      <span className="text-lg font-bold text-gray-900">
                        {segment.customer_count}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{segment.name}</h3>
                    <p className="text-sm text-gray-600">{segment.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Customer Types Breakdown Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Customer Types Breakdown</h2>
                <p className="text-sm text-gray-600">Target specific customer types with personalized campaigns</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customerTypeBreakdown.map((typeData) => (
                  <CustomerTypeCard key={typeData.type} {...typeData} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaign Analytics Tab */}
        {activeTab === 'campaign-analytics' && <CampaignAnalytics />}

        {/* Template Management Tab */}
        {activeTab === 'manage-templates' && <TemplateManagement />}

        {/* Campaign Creation Tab */}
        {activeTab === 'create-campaign' && <CampaignCreation />}

        {/* Placeholder for other tabs */}
        {!['customer-segments', 'campaign-analytics', 'manage-templates', 'create-campaign'].includes(activeTab) && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {tabs.find(t => t.id === activeTab)?.label} - Coming Soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingHub;
