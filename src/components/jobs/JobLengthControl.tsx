import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface JobLengthControlProps {
  jobId: string | null;
}

export const JobLengthControl: React.FC<JobLengthControlProps> = ({ jobId }) => {
  const [jobLengthDays, setJobLengthDays] = useState<number>(3);
  const queryClient = useQueryClient();

  // Update all equipment assignments for this job
  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ lengthDays }: { lengthDays: number }) => {
      if (!jobId) throw new Error('No job ID');

      // Get job details first to get the scheduled date
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('scheduled_date')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      if (!job?.scheduled_date) throw new Error('Job has no scheduled date');

      // Calculate new return date
      const returnDate = format(addDays(new Date(job.scheduled_date), lengthDays - 1), 'yyyy-MM-dd');

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
      toast.success('Equipment assignment dates updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update equipment assignments');
      console.error('Equipment update error:', error);
    },
  });

  const handleApplyToEquipment = () => {
    if (jobLengthDays > 0) {
      updateEquipmentMutation.mutate({ lengthDays: jobLengthDays });
    }
  };

  if (!jobId) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <Calendar className="w-4 h-4 text-blue-600" />
        <h5 className="text-sm font-medium">Job Length</h5>
      </div>
      
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="job-length" className="text-xs text-gray-600">Duration (days)</Label>
          <Input
            id="job-length"
            type="number"
            min="1"
            max="365"
            value={jobLengthDays}
            onChange={(e) => setJobLengthDays(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        
        <Button
          onClick={handleApplyToEquipment}
          disabled={updateEquipmentMutation.isPending}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          <Package className="w-3 h-3 mr-1" />
          {updateEquipmentMutation.isPending ? 'Applying...' : 'Apply to Equipment'}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        This will update all equipment assignment return dates for this job
      </p>
    </div>
  );
};