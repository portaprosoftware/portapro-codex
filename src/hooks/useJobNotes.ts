import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "./useOfflineSync";
import { useOrganizationId } from "./useOrganizationId";
import { createLogger } from "@/lib/logger";

interface JobNote {
  id: string;
  job_id: string;
  driver_id: string;
  note_text: string;
  note_type: 'general' | 'completion' | 'issue' | 'customer_interaction';
  created_at: string;
}

interface AddNoteData {
  jobId: string;
  driverId: string;
  noteText: string;
  noteType?: 'general' | 'completion' | 'issue' | 'customer_interaction';
}

export function useJobNotes(jobId: string) {
  const { orgId } = useOrganizationId();
  const logger = createLogger('useJobNotes', orgId);

  return useQuery({
    queryKey: ['job-notes', jobId, orgId],
    queryFn: async () => {
      if (!orgId) {
        logger.error('Organization ID required to fetch job notes', null, { jobId });
        throw new Error('Organization ID required');
      }

      const { data, error } = await (supabase as any)
        .rpc('get_job_notes', { 
          job_uuid: jobId,
          org_id: orgId 
        });

      if (error) {
        logger.error('Failed to fetch job notes', error, { jobId });
        throw error;
      }
      return data as JobNote[];
    },
    enabled: !!jobId && !!orgId,
  });
}

export function useAddJobNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addToQueue, isOnline } = useOfflineSync();
  const { orgId } = useOrganizationId();
  const logger = createLogger('useAddJobNote', orgId);

  return useMutation({
    mutationFn: async (data: AddNoteData) => {
      if (!orgId) {
        logger.error('Organization ID required to add job note', null, { jobId: data.jobId });
        throw new Error('Organization ID required');
      }

      if (!isOnline) {
        addToQueue({
          type: 'notes',
          jobId: data.jobId,
          data: { 
            noteText: data.noteText,
            driverId: data.driverId,
            noteType: data.noteType || 'general'
          }
        });
        return null;
      }

      const { error } = await (supabase as any)
        .rpc('add_job_note', {
          job_uuid: data.jobId,
          driver_uuid: data.driverId,
          note_content: data.noteText,
          note_category: data.noteType || 'general',
          org_id: orgId
        });

      if (error) {
        logger.error('Failed to add job note', error, { jobId: data.jobId });
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        toast({
          title: "Note Added",
          description: "Your note has been saved",
        });
        queryClient.invalidateQueries({ queryKey: ['job-notes', data.jobId] });
      } else {
        toast({
          title: "Queued for Sync",
          description: "Note will save when connection is restored",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
      console.error('Add note error:', error);
    }
  });
}