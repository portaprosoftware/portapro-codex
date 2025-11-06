import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  invoice_number?: string;
  customer_id: string;
  job_id?: string;
  status: string;
  amount: number;
  due_date?: string;
  paid_date?: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useInvoices(filters?: { status?: string; customerId?: string }) {
  const { orgId } = useOrganizationId();

  return useQuery<any[]>({
    queryKey: ['invoices', orgId, filters],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      let query = supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useInvoice(invoiceId: string | null) {
  const { orgId } = useOrganizationId();

  return useQuery<any | null>({
    queryKey: ['invoice', invoiceId, orgId],
    queryFn: async () => {
      if (!invoiceId || !orgId) return null;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('organization_id', orgId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId && !!orgId,
  });
}

export function useCreateInvoice() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceData: Omit<Invoice, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          organization_id: orgId,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', orgId] });
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create invoice: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInvoice() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...invoiceData }: Partial<Invoice> & { id: string }) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', orgId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id, orgId] });
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update invoice: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInvoice() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!orgId) throw new Error('Organization ID required');

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('organization_id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', orgId] });
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete invoice: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
