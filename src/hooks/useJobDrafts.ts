import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface JobDraft {
  id: string;
  name: string;
  job_data: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useJobDrafts = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch job drafts
  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: ['job-drafts'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('job_drafts')
        .select('*')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async ({ name, data, draftId }: { name: string; data: any; draftId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('job_drafts')
          .update({
            name,
            job_data: data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draftId)
          .eq('created_by', user.id);

        if (error) throw error;
      } else {
        // Create new draft
        const { error } = await supabase
          .from('job_drafts')
          .insert({
            name,
            job_data: data,
            created_by: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-drafts'] });
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('job_drafts')
        .delete()
        .eq('id', draftId)
        .eq('created_by', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-drafts'] });
    },
  });

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
    drafts,
    isLoading,
    error,
    saveDraft,
    deleteDraft,
    isSaving: saveDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending,
  };
};