import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { CustomerPortal } from '@/components/communications/CustomerPortal';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTenantId } from '@/lib/tenantQuery';
import { tenantTable } from '@/lib/db/tenant';

export default function CustomerPortalPage() {
  const { user } = useUser();
  const { customerId } = useParams<{ customerId: string }>();
  const tenantId = useTenantId();

  // Find customer by Clerk user ID if no customerId in URL
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer-portal', tenantId, user?.id, customerId],
    queryFn: async () => {
      if (!user?.id || !tenantId) throw new Error('User not authenticated');

      const query = tenantTable(
        supabase,
        tenantId,
        'customers'
      )
        .select('*');

      const filterQuery = customerId
        ? query.eq('id', customerId)
        : query.eq('clerk_user_id', user.id);

      const { data, error } = await filterQuery.single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!tenantId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ? 'Error loading customer data' : 'Customer not found or not linked to your account'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerPortal customerId={customer.id} />
    </div>
  );
}