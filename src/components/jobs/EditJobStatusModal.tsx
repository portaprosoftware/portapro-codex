import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, Clock, User, Truck, Ban, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';

interface EditJobStatusModalProps {
  jobId: string | null;
  job?: {
    id: string;
    job_number: string;
    status: string;
    job_type: string;
    scheduled_date: string;
    scheduled_time?: string;
    actual_completion_time?: string;
    customers: {
      name: string;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  {
    value: 'unassigned',
    label: 'Unassigned',
    description: 'Job not assigned to any driver',
    icon: Clock,
    variant: 'unassigned' as const,
    requiresConfirmation: false
  },
  {
    value: 'assigned',
    label: 'Assigned',
    description: 'Job assigned to driver but not started',
    icon: User,
    variant: 'assigned' as const,
    requiresConfirmation: false
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    description: 'Job is currently being worked on',
    icon: Truck,
    variant: 'in_progress' as const,
    requiresConfirmation: false
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'Job has been finished successfully',
    icon: Check,
    variant: 'completed' as const,
    requiresConfirmation: true
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Job has been cancelled',
    icon: Ban,
    variant: 'cancelled' as const,
    requiresConfirmation: true
  }
];

export const EditJobStatusModal: React.FC<EditJobStatusModalProps> = ({
  jobId,
  job,
  open,
  onOpenChange
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update job status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!jobId) throw new Error('No job ID');
      
      const { data, error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: `Job status changed to ${statusOptions.find(s => s.value === selectedStatus)?.label}`,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      onOpenChange(false);
      setSelectedStatus(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
      console.error('Status update error:', error);
    }
  });

  const handleStatusSelect = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    
    if (statusOption?.requiresConfirmation) {
      setSelectedStatus(status);
      setShowConfirmation(true);
    } else {
      setSelectedStatus(status);
      updateStatusMutation.mutate(status);
    }
  };

  const handleConfirmUpdate = () => {
    if (selectedStatus) {
      updateStatusMutation.mutate(selectedStatus);
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedStatus(null);
  };

  const currentStatus = job?.status;
  const statusInfo = job ? getDualJobStatusInfo(job) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[500px] max-w-none">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Edit Job Status
            </DialogTitle>
            {job && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600">{job.job_number} • {job.customers.name}</span>
                {statusInfo && (
                  <Badge variant={statusInfo.primary.variant} className="text-xs">
                    Current: {statusInfo.primary.label}
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-3 py-4">
            {statusOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedStatus === option.value;
              const isCurrent = currentStatus === option.value;
              
              return (
                <Card 
                  key={option.value}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isCurrent 
                      ? 'border-blue-500 bg-blue-50' 
                      : isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !isCurrent && handleStatusSelect(option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCurrent 
                            ? 'bg-blue-100' 
                            : isSelected 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            isCurrent 
                              ? 'text-blue-600' 
                              : isSelected 
                                ? 'text-green-600' 
                                : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{option.label}</h4>
                            {isCurrent && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                            {option.requiresConfirmation && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                      
                      {isSelected && !isCurrent && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Critical Status Changes */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the job status to{' '}
              <strong>{statusOptions.find(s => s.value === selectedStatus)?.label}</strong>?
              {selectedStatus === 'completed' && (
                <span className="block mt-2 text-sm">
                  This will mark the job as finished and may trigger customer notifications.
                </span>
              )}
              {selectedStatus === 'cancelled' && (
                <span className="block mt-2 text-sm">
                  This will cancel the job and may require additional follow-up actions.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              disabled={updateStatusMutation.isPending}
              className={selectedStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};