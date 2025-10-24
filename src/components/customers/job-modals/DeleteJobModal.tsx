import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  customerId: string;
}

export function DeleteJobModal({ open, onOpenChange, job, customerId }: DeleteJobModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First check if there are any maintenance reports associated
      const { data: reports } = await supabase
        .from('maintenance_reports')
        .select('id')
        .eq('job_id', job.id);

      if (reports && reports.length > 0) {
        throw new Error('Cannot delete job with associated service reports. Please delete reports first.');
      }

      // Delete the job
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Job deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['customer-jobs', customerId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete job',
        variant: 'destructive'
      });
    }
  });

  if (!job) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete job <strong className="text-foreground">{job.job_number}</strong>?
            </p>
            <p className="text-red-600 font-medium">
              This action cannot be undone. This will permanently delete the job and remove all associated data.
            </p>
            {job.maintenance_reports && job.maintenance_reports.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Warning: This job has {job.maintenance_reports.length} associated service report(s).
                  You must delete those reports first before deleting this job.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Job
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
