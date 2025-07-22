import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, MessageCircle, TrendingUp, Plus } from 'lucide-react';
import { Navigate } from 'react-router-dom';

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

  // Fetch customer type counts
  const { data: customerTypes } = useQuery({
    queryKey: ['customer-type-counts'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_customer_type_counts');
      return data || [];
    }
  });

  const tabs = [
    { id: 'customer-segments', label: 'Customer Segments' },
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Hub</h1>
          <p className="text-gray-600">Manage customer segments, campaigns, and communications</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <Button className="bg-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Smart Segment
                </Button>
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

            {/* Customer Types Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Customer Types</h2>
                <p className="text-sm text-gray-600">Target specific customer types with personalized campaigns</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerTypes?.map((type) => (
                  <Card key={type.customer_type} className="p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <div 
                        className="px-3 py-1 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: getCustomerTypeColor(type.customer_type) }}
                      >
                        {type.customer_type}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {type.total_count}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" style={{ color: 'hsl(142, 71%, 45%)' }} />
                          <span className="text-sm text-gray-600">Email</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'hsl(142, 71%, 45%)' }}>
                          {type.email_count}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4" style={{ color: 'hsl(259, 55%, 52%)' }} />
                          <span className="text-sm text-gray-600">SMS</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'hsl(259, 55%, 52%)' }}>
                          {type.sms_count}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" style={{ color: 'hsl(25, 95%, 53%)' }} />
                          <span className="text-sm text-gray-600">Both</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'hsl(25, 95%, 53%)' }}>
                          {type.both_count}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'customer-segments' && (
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