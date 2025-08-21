import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { CustomerPortal } from '@/components/communications/CustomerPortal';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CustomerPortalPage() {
  const { user } = useUser();
  const { customerId } = useParams<{ customerId: string }>();

  // Find customer by Clerk user ID if no customerId in URL
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer-portal', user?.id, customerId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase.from('customers').select('*');
      
      if (customerId) {
        // Direct customer ID provided in URL
        query = query.eq('id', customerId);
      } else {
        // Find customer by Clerk user ID
        query = query.eq('clerk_user_id', user.id);
      }
      
      const { data, error } = await query.single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
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