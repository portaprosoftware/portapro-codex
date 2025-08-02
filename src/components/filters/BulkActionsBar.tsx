import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BulkActionsBarProps {
  selectedJobsCount: number;
  selectedJobIds: string[];
  drivers: any[];
  onJobsUpdated: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedJobsCount,
  selectedJobIds,
  drivers,
  onJobsUpdated,
  onClearSelection
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleAssignToDriver = async (driverId: string) => {
    if (!driverId || selectedJobIds.length === 0) return;

    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .in('id', selectedJobIds);

      if (error) throw error;

      const driver = drivers.find(d => d.id === driverId);
      toast({
        title: 'Jobs Assigned',
        description: `Successfully assigned ${selectedJobIds.length} jobs to ${driver?.first_name} ${driver?.last_name}.`,
      });

      onJobsUpdated();
      onClearSelection();

    } catch (error) {
      console.error('Bulk assign error:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign jobs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (selectedJobIds.length === 0) return;

    setIsUpdating(true);
    
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          actual_completion_time: now,
          updated_at: now
        })
        .in('id', selectedJobIds)
        .neq('status', 'completed'); // Only update non-completed jobs

      if (error) throw error;

      toast({
        title: 'Jobs Completed',
        description: `Successfully marked ${selectedJobIds.length} jobs as completed.`,
      });

      onJobsUpdated();
      onClearSelection();

    } catch (error) {
      console.error('Bulk complete error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to mark jobs as completed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkCancelled = async () => {
    if (selectedJobIds.length === 0) return;

    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', selectedJobIds)
        .not('status', 'in', '(completed,cancelled)'); // Don't cancel already completed/cancelled jobs

      if (error) throw error;

      toast({
        title: 'Jobs Cancelled',
        description: `Successfully cancelled ${selectedJobIds.length} jobs.`,
      });

      onJobsUpdated();
      onClearSelection();

    } catch (error) {
      console.error('Bulk cancel error:', error);
      toast({
        title: 'Cancellation Failed',
        description: 'Failed to cancel jobs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (selectedJobsCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedJobsCount} job{selectedJobsCount > 1 ? 's' : ''} selected
        </span>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Select onValueChange={handleAssignToDriver} disabled={isUpdating}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder="Assign to driver..." />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-3 w-3" />
                    {driver.first_name} {driver.last_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleMarkCompleted}
            disabled={isUpdating}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Mark Completed
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={isUpdating}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Cancel Jobs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Cancel Selected Jobs
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel {selectedJobsCount} selected job{selectedJobsCount > 1 ? 's' : ''}? 
                  This action cannot be undone and will set the job status to cancelled.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, Keep Jobs</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleMarkCancelled}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Cancel Jobs
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Button size="sm" variant="ghost" onClick={onClearSelection}>
        Clear Selection
      </Button>
    </div>
  );
};