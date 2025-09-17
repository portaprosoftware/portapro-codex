import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, differenceInDays } from 'date-fns';
import { parseDateSafe } from '@/lib/dateUtils';

interface JobLengthControlProps {
  jobId: string | null;
  jobType?: string;
}

export const JobLengthControl: React.FC<JobLengthControlProps> = ({ jobId, jobType }) => {
  // Get job details and current equipment assignments
  const { data: jobData } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select('scheduled_date')
        .eq('id', jobId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const { data: equipmentData } = useQuery({
    queryKey: ['job-equipment', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('equipment_assignments')
        .select('return_date, assigned_date')
        .eq('job_id', jobId)
        .not('return_date', 'is', null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId,
  });

  // Calculate current job length and dates
  const scheduledDate = jobData?.scheduled_date ? parseDateSafe(jobData.scheduled_date) : null;
  const currentReturnDate = equipmentData?.length > 0 
    ? parseDateSafe(equipmentData[0].return_date) 
    : null;
  
  const currentJobLength = scheduledDate && currentReturnDate 
    ? differenceInDays(currentReturnDate, scheduledDate) + 1  // Inclusive counting
    : null;

  // Only show for delivery jobs
  if (!jobId || !scheduledDate || jobType !== 'delivery') return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <Calendar className="w-4 h-4 text-blue-600" />
        <h5 className="text-sm font-medium">Rental Period</h5>
      </div>
      
      <div className="space-y-3">
        {/* Current pickup date display */}
        <div className="text-sm">
          <span className="text-gray-600">Current pickup: </span>
          <span className="font-medium">
            {currentReturnDate ? format(currentReturnDate, 'EEEE, MMM do') : 'Not set'}
          </span>
        </div>

        {/* Job length display */}
        {currentJobLength && (
          <div className="text-sm">
            <span className="text-gray-600">Duration: </span>
            <span className="font-medium">{currentJobLength} days</span>
          </div>
        )}
      </div>
    </div>
  );
};