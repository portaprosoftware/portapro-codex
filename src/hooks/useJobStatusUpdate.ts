import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "./useOfflineSync";

interface JobStatusUpdateData {
  jobId: string;
  status: string;
  driverId?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export function useJobStatusUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addToQueue, isOnline } = useOfflineSync();

  return useMutation({
    mutationFn: async (data: JobStatusUpdateData) => {
      if (!isOnline) {
        addToQueue({
          type: 'status_update',
          jobId: data.jobId,
          data: { status: data.status, driverId: data.driverId }
        });
        return null;
      }

      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.jobId);

      if (error) throw error;

      // Log the status change with location if provided
      if (data.latitude && data.longitude) {
        await supabase
          .rpc('log_job_status_change', {
            job_uuid: data.jobId,
            changed_by_uuid: data.driverId,
            new_status_value: data.status,
            lat: data.latitude,
            lng: data.longitude,
            change_notes: data.notes
          });
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        toast({
          title: "Status Updated",
          description: `Job status changed to ${data.status}`,
        });
      } else {
        toast({
          title: "Queued for Sync",
          description: "Status will update when connection is restored",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
      console.error('Job status update error:', error);
    }
  });
}