import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useUser } from '@clerk/clerk-react';
import { formatDateForQuery } from '@/lib/dateUtils';
import { useJobs } from '@/hooks/useJobs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StandaloneDispatchView } from '@/components/dispatch/StandaloneDispatchView';

const DispatchMonitor: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();

  // If not signed in, show simple message
  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dispatch Monitor</h1>
          <p className="text-muted-foreground">Please sign in to view the dispatch center.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Dispatch Monitor...</h1>
        </div>
      </div>
    );
  }

  return <DispatchMonitorContent selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
};

const DispatchMonitorContent: React.FC<{
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}> = ({ selectedDate, setSelectedDate }) => {
  const queryClient = useQueryClient();

  // Get jobs for the selected date
  const { data: allJobsRaw = [] } = useJobs({
    date: formatDateForQuery(selectedDate)
  });

  // Filter out cancelled jobs by default
  const allJobs = React.useMemo(() => {
    return allJobsRaw.filter(job => job.status !== 'cancelled');
  }, [allJobsRaw]);

  // Get drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Job assignment mutation
  const updateJobAssignmentMutation = useMutation({
    mutationFn: async ({ jobId, driverId, timeSlotId }: { jobId: string; driverId: string | null; timeSlotId?: string | null }) => {
      const updateData: any = { 
        driver_id: driverId,
        status: driverId ? 'assigned' : 'unassigned',
        updated_at: new Date().toISOString()
      };

      // Handle scheduled_time based on time slot
      if (timeSlotId) {
        if (timeSlotId === 'no-time') {
          updateData.scheduled_time = null;
        } else if (timeSlotId === 'late') {
          updateData.scheduled_time = '20:00';
        } else {
          // Extract start hour from time slot ID (e.g., '9-10' -> '09:00')
          const startHour = timeSlotId.split('-')[0];
          updateData.scheduled_time = `${startHour.padStart(2, '0')}:00`;
        }
      }

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job assignment updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update job assignment');
      console.error('Job assignment error:', error);
    }
  });

  const handleJobAssignment = (jobId: string, driverId: string | null, timeSlotId?: string | null) => {
    updateJobAssignmentMutation.mutate({ jobId, driverId, timeSlotId });
  };

  const handleJobView = (jobId: string) => {
    // For monitor view, we don't open modals - just log or do nothing
    console.log('Job view clicked for job:', jobId);
    toast.info('Job details not available in monitor view');
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      <StandaloneDispatchView
        jobs={allJobs}
        drivers={drivers}
        selectedDate={selectedDate}
        onJobAssignment={handleJobAssignment}
        onJobView={handleJobView}
        onDateChange={setSelectedDate}
      />
    </div>
  );
};

export default DispatchMonitor;