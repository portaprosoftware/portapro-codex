import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, MapPin, FileText, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { getJobStatusInfo } from '@/lib/jobStatusUtils';

interface JobDetailModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailModal({ jobId, open, onOpenChange }: JobDetailModalProps) {
  const queryClient = useQueryClient();

  // Fetch job data
  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:customers!inner(id, name, email, phone),
          driver:profiles(id, first_name, last_name),
          vehicle:vehicles(id, license_plate, vehicle_type)
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!jobId && open,
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      if (!jobId) throw new Error('No job ID');
      
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.actual_completion_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-detail'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update job status');
      console.error('Status update error:', error);
    },
  });

  const handleStartJob = () => {
    const newStatus = job?.status === 'assigned' ? 'in_progress' : 'completed';
    statusUpdateMutation.mutate({ status: newStatus });
  };

  const handleReverseJob = () => {
    const newStatus = job?.status === 'completed' ? 'in_progress' : 'assigned';
    statusUpdateMutation.mutate({ status: newStatus });
  };

  const getJobButtonText = () => {
    if (!job) return 'Start Job';
    return job.status === 'assigned' ? 'Start Job' : 'Complete Job';
  };

  const canStartJob = job?.status === 'assigned' || job?.status === 'in_progress';
  const canReverseJob = job?.status === 'in_progress' || job?.status === 'completed';

  if (!job && !isLoading) return null;

  const statusInfo = job ? getJobStatusInfo(job) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-semibold">
                {job?.job_number || 'Job Details'}
              </DialogTitle>
              {statusInfo && (
                <Badge 
                  variant="outline"
                  className={`${statusInfo.gradient} text-white border-0`}
                >
                  {statusInfo.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canStartJob && (
                <Button
                  onClick={handleStartJob}
                  disabled={statusUpdateMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {getJobButtonText()}
                </Button>
              )}
              {canReverseJob && (
                <Button
                  onClick={handleReverseJob}
                  disabled={statusUpdateMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reverse
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading job details...</div>
            </div>
          ) : (
            <>
              {/* Schedule Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="w-4 h-4" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-sm">{job?.scheduled_date || 'Not scheduled'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Time</label>
                      <p className="text-sm">{job?.scheduled_time || 'Not scheduled'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job Type</label>
                    <p className="text-sm capitalize">{job?.job_type || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Driver</label>
                    <p className="text-sm">
                      {job?.driver ? `${job.driver.first_name} ${job.driver.last_name}` : 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                    <p className="text-sm">
                      {job?.vehicle ? `${job.vehicle.license_plate} (${job.vehicle.vehicle_type})` : 'Unassigned'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{job?.customer?.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{job?.customer?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-sm">{job?.customer?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {job?.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}