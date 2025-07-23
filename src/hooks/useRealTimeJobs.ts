import { useEffect, useState } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  status: string;
  customer_id: string;
  driver_id?: string;
  scheduled_date: string;
  job_type: string;
  job_number: string;
}

export function useRealTimeJobs(driverId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    // Subscribe to job changes for this driver
    const jobChannel = supabase
      .channel('driver-jobs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `driver_id=eq.${driverId}`
      }, (payload) => {
        console.log('Job update received:', payload);
        
        if (payload.eventType === 'UPDATE') {
          const oldRecord = payload.old as Job;
          const newRecord = payload.new as Job;
          
          // Show notification for status changes
          if (oldRecord.status !== newRecord.status) {
            toast({
              title: "Job Status Updated",
              description: `Job ${newRecord.job_number} status changed to ${newRecord.status}`,
            });
          }
        } else if (payload.eventType === 'INSERT') {
          const newJob = payload.new as Job;
          toast({
            title: "New Job Assigned",
            description: `Job ${newJob.job_number} has been assigned to you`,
          });
        }

        // Invalidate and refetch job queries
        queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'job_status_logs'
      }, (payload) => {
        console.log('Job status log update:', payload);
        // Invalidate status logs if needed
        queryClient.invalidateQueries({ queryKey: ['job-status-logs'] });
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          toast({
            title: "Connected",
            description: "Real-time updates are active",
          });
        } else if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Real-time updates may be delayed",
            variant: "destructive",
          });
        }
      });

    // Subscribe to general job assignments (jobs that might be assigned to this driver)
    const assignmentChannel = supabase
      .channel('job-assignments')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs'
      }, (payload) => {
        const newRecord = payload.new as Job;
        const oldRecord = payload.old as Job;
        
        // Check if this job was just assigned to this driver
        if (!oldRecord.driver_id && newRecord.driver_id === driverId) {
          toast({
            title: "New Job Assignment",
            description: `You've been assigned job ${newRecord.job_number}`,
          });
          queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
        }
      })
      .subscribe();

    return () => {
      jobChannel.unsubscribe();
      assignmentChannel.unsubscribe();
    };
  }, [driverId, queryClient, toast]);

  return {
    isConnected
  };
}