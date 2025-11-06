import { useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from './useOrganizationId';

export interface CampaignDraft {
  id: string;
  name: string;
  campaign_data: any;
  created_at: string;
  updated_at: string;
}

export const useCampaignDrafts = () => {
  const { user } = useUser();
  const { orgId, isReady } = useOrganizationId();
  const queryClient = useQueryClient();

  // Simple fetch with explicit typing to avoid deep type inference
  const { data: drafts, isLoading, error } = useQuery({
    queryKey: ['campaign-drafts', orgId, user?.id],
    queryFn: async () => {
      if (!user?.id || !orgId) return [] as CampaignDraft[];
      
      try {
        const { data, error } = await supabase
          .from('campaign_drafts')
          .select('id, name, campaign_data, created_at, updated_at')
          .eq('organization_id', orgId)
          .eq('created_by', user.id)
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.error('Draft fetch error:', error);
          return [] as CampaignDraft[];
        }
        
        return (data || []) as CampaignDraft[];
      } catch (err) {
        console.error('Draft fetch failed:', err);
        return [] as CampaignDraft[];
      }
    },
    enabled: isReady && !!user?.id && !!orgId,
  });

  // Simple save mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (params: { name: string; data: any; draftId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!orgId) throw new Error('Organization ID not found');

      if (params.draftId) {
        // Update existing
        const { error } = await supabase
          .from('campaign_drafts')
          .update({
            name: params.name,
            campaign_data: params.data,
          })
          .eq('id', params.draftId)
          .eq('created_by', user.id)
          .eq('organization_id', orgId);
        
        if (error) throw error;
        return params.draftId;
      } else {
        // Create new
        const { data: newDraft, error } = await supabase
          .from('campaign_drafts')
          .insert({
            organization_id: orgId,
            created_by: user.id,
            name: params.name,
            campaign_data: params.data,
          })
          .select('id')
          .single();
        
        if (error) throw error;
        return newDraft?.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-drafts'] });
    },
  });

  // Simple delete mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!orgId) throw new Error('Organization ID not found');
      
      const { error } = await supabase
        .from('campaign_drafts')
        .delete()
        .eq('id', draftId)
        .eq('created_by', user.id)
        .eq('organization_id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-drafts'] });
    },
  });

  // Simple wrapper functions
  const saveDraft = useCallback(
    (name: string, data: any, draftId?: string) => {
      return saveDraftMutation.mutateAsync({ name, data, draftId });
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
    drafts: drafts || [],
    isLoading: isLoading || false,
    error,
    saveDraft,
    deleteDraft,
    isSaving: saveDraftMutation.isPending || false,
    isDeleting: deleteDraftMutation.isPending || false,
  };
};