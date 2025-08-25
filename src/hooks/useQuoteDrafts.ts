import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface QuoteDraft {
  id: string;
  quote_number: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email: string;
  };
}

export const useQuoteDrafts = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch quote drafts
  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: ['quote-drafts'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id (
            name,
            email
          )
        `)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Save draft mutation - now works with quotes table
  const saveDraftMutation = useMutation({
    mutationFn: async ({ quoteNumber, customerId, totalAmount, quoteId }: { 
      quoteNumber: string; 
      customerId: string; 
      totalAmount: number; 
      quoteId?: string; 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (quoteId) {
        // Update existing draft quote
        const { error } = await supabase
          .from('quotes')
          .update({
            quote_number: quoteNumber,
            customer_id: customerId,
            total_amount: totalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', quoteId)
          .eq('status', 'draft');

        if (error) throw error;
      } else {
        // Create new draft quote
        const { error } = await supabase
          .from('quotes')
          .insert({
            quote_number: quoteNumber,
            customer_id: customerId,
            total_amount: totalAmount,
            status: 'draft',
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', draftId)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const saveDraft = useCallback(
    (quoteNumber: string, customerId: string, totalAmount: number, quoteId?: string) => {
      return saveDraftMutation.mutateAsync({ quoteNumber, customerId, totalAmount, quoteId });
    },
    [saveDraftMutation]
  );

  const deleteDraft = useCallback(
    (draftId: string) => {
      return deleteDraftMutation.mutateAsync(draftId);
    },
    [deleteDraftMutation]
  );

  return {
    drafts,
    isLoading,
    error,
    saveDraft,
    deleteDraft,
    isSaving: saveDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending,
  };
};