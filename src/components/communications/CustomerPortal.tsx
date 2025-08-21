
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerPortalDashboard } from '@/components/customer-portal/CustomerPortalDashboard';
import { ServiceHistoryTab } from '@/components/customer-portal/ServiceHistoryTab';
import { RequestsTab } from '@/components/customer-portal/RequestsTab';
import { 
  BarChart3, 
  History, 
  Plus, 
  Package, 
  Calendar,
  User,
  Settings,
  LogOut,
  CreditCard,
  FileText,
  Users,
  HelpCircle,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { UnitsTab } from '@/components/customer-portal/UnitsTab';
import { BillingTab } from '@/components/customer-portal/BillingTab';
import { QuotesTab } from '@/components/customer-portal/QuotesTab';
import { UsersTab } from '@/components/customer-portal/UsersTab';
import { SupportTab } from '@/components/customer-portal/SupportTab';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'units', label: 'Units', icon: Package },
  { id: 'service-history', label: 'Service History', icon: History },
  { id: 'requests', label: 'Requests', icon: Plus },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'support', label: 'Support', icon: HelpCircle },
];

interface CustomerPortalProps {
  customerId?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ customerId }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [supportMessage, setSupportMessage] = useState('');

  // Fetch real customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-portal', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  // Fetch real jobs data
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['customer-jobs', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          job_type,
          status,
          scheduled_date,
          scheduled_time,
          actual_completion_time
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  // Fetch real invoices data
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['customer-invoices', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  if (customerLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'overdue': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold">Customer Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {customer?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Emergency: (555) 123-4567
              </Button>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-4">
            <nav className="flex items-center gap-2 p-1 bg-muted/50 rounded-full">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/90 to-primary text-primary-foreground shadow-md transform scale-105'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <CustomerPortalDashboard customerId={customerId || ''} />}
        {activeTab === 'units' && <UnitsTab customerId={customerId || ''} />}
        {activeTab === 'service-history' && <ServiceHistoryTab customerId={customerId || ''} />}
        {activeTab === 'requests' && <RequestsTab customerId={customerId || ''} />}
        {activeTab === 'billing' && <BillingTab customerId={customerId || ''} />}
        {activeTab === 'quotes' && <QuotesTab customerId={customerId || ''} />}
        {activeTab === 'users' && <UsersTab customerId={customerId || ''} />}
        {activeTab === 'support' && <SupportTab customerId={customerId || ''} />}
      </div>
    </div>
  );
};
