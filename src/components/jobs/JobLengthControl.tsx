import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar, Package, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, differenceInDays } from 'date-fns';

interface JobLengthControlProps {
  jobId: string | null;
}

export const JobLengthControl: React.FC<JobLengthControlProps> = ({ jobId }) => {
  const [adjustmentDays, setAdjustmentDays] = useState<number>(0);
  const queryClient = useQueryClient();

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
  const scheduledDate = jobData?.scheduled_date ? new Date(jobData.scheduled_date) : null;
  const currentReturnDate = equipmentData?.length > 0 
    ? new Date(equipmentData[0].return_date) 
    : scheduledDate ? addDays(scheduledDate, 3) : null; // Default to 3 days
  
  const currentJobLength = scheduledDate && currentReturnDate 
    ? differenceInDays(currentReturnDate, scheduledDate) + 1  // Inclusive counting
    : 3;

  const newJobLength = currentJobLength + adjustmentDays;
  const newReturnDate = scheduledDate ? addDays(scheduledDate, newJobLength) : null;

  // Reset adjustment when job data changes
  useEffect(() => {
    setAdjustmentDays(0);
  }, [jobId, currentJobLength]);

  // Update all equipment assignments for this job
  const updateEquipmentMutation = useMutation({
    mutationFn: async () => {
      if (!jobId || !scheduledDate) throw new Error('No job ID or scheduled date');

      // Calculate new return date
      const returnDate = format(addDays(scheduledDate, newJobLength), 'yyyy-MM-dd');

      // Update all equipment assignments for this job
      const { error } = await supabase
        .from('equipment_assignments')
        .update({
          return_date: returnDate,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-equipment', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-detail'] });
      setAdjustmentDays(0);
      toast.success('Equipment assignment dates updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update equipment assignments');
      console.error('Equipment update error:', error);
    },
  });

  const handleApplyToEquipment = () => {
    if (newJobLength > 0 && adjustmentDays !== 0) {
      updateEquipmentMutation.mutate();
    }
  };

  const adjustJobLength = (change: number) => {
    const newAdjustment = adjustmentDays + change;
    const finalLength = currentJobLength + newAdjustment;
    if (finalLength >= 1) {
      setAdjustmentDays(newAdjustment);
    }
  };

  if (!jobId) return null;

  if (!jobId || !scheduledDate) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <Calendar className="w-4 h-4 text-blue-600" />
        <h5 className="text-sm font-medium">Job Length</h5>
      </div>
      
      <div className="space-y-3">
        {/* Current pickup date display */}
        <div className="text-sm">
          <span className="text-gray-600">Current pickup: </span>
          <span className="font-medium">
            {currentReturnDate ? format(currentReturnDate, 'EEEE, MMM do') : 'Not set'}
          </span>
        </div>

        {/* Duration controls */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => adjustJobLength(-1)}
            disabled={newJobLength <= 1}
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
          >
            <Minus className="w-3 h-3" />
          </Button>
          
          <div className="text-center min-w-[80px]">
            <div className="text-sm font-medium">{newJobLength} days</div>
            {adjustmentDays !== 0 && (
              <div className="text-xs text-muted-foreground">
                {adjustmentDays > 0 ? '+' : ''}{adjustmentDays} days
              </div>
            )}
          </div>
          
          <Button
            type="button"
            onClick={() => adjustJobLength(1)}
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* New pickup date preview */}
        {adjustmentDays !== 0 && newReturnDate && (
          <div className="text-sm">
            <span className="text-gray-600">New pickup: </span>
            <span className="font-medium text-blue-600">
              {format(newReturnDate, 'EEEE, MMM do')}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ({adjustmentDays > 0 ? '+' : ''}{adjustmentDays} day{Math.abs(adjustmentDays) !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Apply button */}
        {adjustmentDays !== 0 && (
          <Button
            type="button"
            onClick={handleApplyToEquipment}
            disabled={updateEquipmentMutation.isPending}
            size="sm"
            className="w-full"
          >
            <Package className="w-3 h-3 mr-1" />
            {updateEquipmentMutation.isPending ? 'Applying...' : 'Apply to Equipment'}
          </Button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        This will update all equipment assignment return dates for this job
      </p>
    </div>
  );
};