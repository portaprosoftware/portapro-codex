import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignDraft {
  id: string;
  name?: string;
  campaign_data: any;
  created_at: string;
  updated_at: string;
}

export interface CampaignDraftData {
  campaign_name?: string;
  current_step?: number;
  draft_data?: Record<string, any>;
}

export const useCampaignDrafts = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch drafts
  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: ['campaign-drafts', user?.id],
    queryFn: async (): Promise<CampaignDraft[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('campaign_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async ({ data, draftId }: { data: CampaignDraftData; draftId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('campaign_drafts')
          .update({
            name: data.campaign_name,
            campaign_data: data.draft_data || {},
          })
          .eq('id', draftId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return draftId;
      } else {
        // Create new draft
        const { data: newDraft, error } = await supabase
          .from('campaign_drafts')
          .insert({
            user_id: user.id,
            name: data.campaign_name,
            campaign_data: data.draft_data || {},
          })
          .select()
          .single();
        
        if (error) throw error;
        return newDraft.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-drafts'] });
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('campaign_drafts')
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-drafts'] });
    },
  });

  const saveDraft = useCallback(
    async (draftData: CampaignDraftData, draftId?: string) => {
      return saveDraftMutation.mutateAsync({ data: draftData, draftId });
    },
    [saveDraftMutation]
  );

  const deleteDraft = useCallback(
    async (draftId: string) => {
      return deleteDraftMutation.mutateAsync(draftId);
    },
    [deleteDraftMutation]
  );

  const scheduleAutoSave = useCallback(
    (draftData: CampaignDraftData, draftId?: string, delay = 30000) => {
      // Auto-save implementation
      const timeoutId = setTimeout(() => {
        if (draftData.current_step && draftData.current_step >= 3) {
          saveDraft(draftData, draftId).catch(console.error);
        }
      }, delay);
      
      return () => clearTimeout(timeoutId);
    },
    [saveDraft]
  );

  return {
    drafts,
    isLoading,
    error,
    saveDraft,
    deleteDraft,
    scheduleAutoSave,
    isSaving: saveDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending,
  };
};