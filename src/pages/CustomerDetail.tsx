import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { CustomerStatsSection } from '@/components/customers/CustomerStatsSection';
import { CustomerTabs } from '@/components/customers/CustomerTabs';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();

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

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-foreground mb-4">Customer not found</h1>
        <Link to="/customers">
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-md border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/customers">Customers</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{customer.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <Link to="/customers">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-3 py-2 rounded-md border-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Customer List
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {(customer as any).type || customer.customer_type || 'Customer'} • {customer.email} • {customer.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <CustomerStatsSection customerId={id!} />
        <CustomerTabs customer={{
          ...customer,
          contact_first_name: (customer as any).contact_first_name || '',
          contact_last_name: (customer as any).contact_last_name || '',
          type: (customer as any).type || customer.customer_type || '',
          service_street: (customer as any).service_street || customer.address?.split(',')[0] || '',
          service_street2: (customer as any).service_street2 || '',
          service_city: (customer as any).service_city || customer.address?.split(',')[1]?.trim() || '',
          service_state: (customer as any).service_state || customer.address?.split(',')[2]?.trim() || '',
          service_zip: (customer as any).service_zip || customer.address?.split(',')[3]?.trim() || '',
        }} />
      </div>
    </div>
  );
}