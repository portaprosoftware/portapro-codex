import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { useToast } from '@/hooks/use-toast';

export interface Quote {
  id: string;
  quote_number?: string;
  customer_id: string;
  status: string;
  total_amount: number;
  valid_until?: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useQuotes(filters?: { status?: string; customerId?: string }) {
  const { orgId } = useOrganizationId();

  return useQuery<Quote[]>({
    queryKey: ['quotes', orgId, filters],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      let query = supabase
        .from('quotes')
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

export function useQuote(quoteId: string | null) {
  const { orgId } = useOrganizationId();

  return useQuery<Quote | null>({
    queryKey: ['quote', quoteId, orgId],
    queryFn: async () => {
      if (!quoteId || !orgId) return null;

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('organization_id', orgId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!quoteId && !!orgId,
  });
}

export function useCreateQuote() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteData: Omit<Quote, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          ...quoteData,
          organization_id: orgId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', orgId] });
      toast({
        title: 'Success',
        description: 'Quote created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create quote: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateQuote() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...quoteData }: Partial<Quote> & { id: string }) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', orgId] });
      queryClient.invalidateQueries({ queryKey: ['quote', data.id, orgId] });
      toast({
        title: 'Success',
        description: 'Quote updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update quote: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteQuote() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      if (!orgId) throw new Error('Organization ID required');

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)
        .eq('organization_id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', orgId] });
      toast({
        title: 'Success',
        description: 'Quote deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete quote: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
