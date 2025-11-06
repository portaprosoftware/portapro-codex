import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useCustomers() {
  const { orgId } = useOrganizationId();

  return useQuery<Customer[]>({
    queryKey: ['customers', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', orgId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useCustomer(customerId: string | null) {
  const { orgId } = useOrganizationId();

  return useQuery<Customer | null>({
    queryKey: ['customer', customerId, orgId],
    queryFn: async () => {
      if (!customerId || !orgId) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', orgId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId && !!orgId,
  });
}

export function useCreateCustomer() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerData: Omit<Customer, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          organization_id: orgId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] });
      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create customer: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCustomer() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...customerData }: Partial<Customer> & { id: string }) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] });
      queryClient.invalidateQueries({ queryKey: ['customer', data.id, orgId] });
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update customer: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCustomer() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerId: string) => {
      if (!orgId) throw new Error('Organization ID required');

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('organization_id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] });
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete customer: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
