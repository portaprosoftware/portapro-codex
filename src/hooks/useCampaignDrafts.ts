import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';

export interface CampaignDraft {
  id: string;
  user_id: string;
  campaign_name?: string;
  campaign_description?: string;
  audience_type?: string;
  current_step?: number;
  draft_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CampaignDraftData {
  campaign_name?: string;
  campaign_description?: string;
  audience_type?: string;
  current_step?: number;
  draft_data?: Record<string, any>;
}

export const useCampaignDrafts = () => {
  const { user } = useUser();
  const [drafts] = useState<CampaignDraft[]>([]);
  const [isLoading] = useState(false);

  const saveDraft = useCallback(
    async (draftData: CampaignDraftData, draftId?: string) => {
      // TODO: Implement with Supabase when campaign_drafts table is created
      console.log('Saving draft:', draftData, draftId);
      return Promise.resolve();
    },
    []
  );

  const deleteDraft = useCallback(
    async (draftId: string) => {
      // TODO: Implement with Supabase when campaign_drafts table is created
      console.log('Deleting draft:', draftId);
      return Promise.resolve();
    },
    []
  );

  const scheduleAutoSave = useCallback(
    (draftData: CampaignDraftData, draftId?: string, delay = 30000) => {
      // TODO: Implement auto-save when database is ready
      console.log('Scheduling auto-save:', draftData, draftId, delay);
    },
    []
  );

  return {
    drafts,
    isLoading,
    error: null,
    saveDraft,
    deleteDraft,
    scheduleAutoSave,
    isSaving: false,
    isDeleting: false,
  };
};