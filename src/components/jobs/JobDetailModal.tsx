import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarDays, Clock, User, MapPin, FileText, Play, RotateCcw, Edit2, Save, X, Star, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { getJobStatusInfo } from '@/lib/jobStatusUtils';
import { formatDateForQuery, formatDateSafe } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Job types from wizard for consistency
const jobTypes = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'service', label: 'Service' },
  { value: 'on-site-survey', label: 'Site Survey' },
] as const;

// Form schema (same validation as wizard)
const jobEditSchema = z.object({
  job_type: z.enum(['delivery', 'pickup', 'service', 'on-site-survey']),
  scheduled_date: z.string().min(1, 'Date is required'),
  scheduled_time: z.string().nullable(),
  driver_id: z.string().nullable(),
  vehicle_id: z.string().nullable(),
  special_instructions: z.string().optional(),
  notes: z.string().optional(),
  is_priority: z.boolean().optional(),
});

type JobEditForm = z.infer<typeof jobEditSchema>;

interface JobDetailModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailModal({ jobId, open, onOpenChange }: JobDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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

  // Fetch drivers for dropdown
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Fetch vehicles for dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type')
        .eq('status', 'active')
        .order('license_plate');
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Form setup
  const form = useForm<JobEditForm>({
    resolver: zodResolver(jobEditSchema),
    defaultValues: {
      job_type: 'delivery',
      scheduled_date: '',
      scheduled_time: null,
      driver_id: null,
      vehicle_id: null,
      special_instructions: '',
      notes: '',
      is_priority: false,
    },
  });

  // Update form when job data loads
  useEffect(() => {
    if (job) {
      const validJobType = jobTypes.find(t => t.value === job.job_type)?.value || 'delivery';
      form.reset({
        job_type: validJobType,
        scheduled_date: job.scheduled_date || '',
        scheduled_time: job.scheduled_time || null,
        driver_id: job.driver_id || null,
        vehicle_id: job.vehicle_id || null,
        special_instructions: job.special_instructions || '',
        notes: job.notes || '',
        is_priority: (job as any).is_priority ?? false,
      });
    }
  }, [job, form]);

  // Job update mutation
  const updateJobMutation = useMutation({
    mutationFn: async (data: JobEditForm) => {
      if (!jobId) throw new Error('No job ID');
      
      const { error } = await supabase
        .from('jobs')
        .update({
          job_type: data.job_type,
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time,
          driver_id: data.driver_id,
          vehicle_id: data.vehicle_id,
          special_instructions: data.special_instructions,
          notes: data.notes,
          is_priority: data.is_priority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-detail'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error('Failed to update job');
      console.error('Job update error:', error);
    },
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

  const handleCancelJob = () => {
    statusUpdateMutation.mutate({ status: 'cancelled' });
    setShowCancelDialog(false);
  };

  const getJobButtonText = () => {
    if (!job) return 'Start Job';
    return job.status === 'assigned' ? 'Start Job' : 'Complete Job';
  };

  const handleSave = (data: JobEditForm) => {
    updateJobMutation.mutate(data);
  };

  const handleCancelEdit = () => {
    form.reset();
    setIsEditing(false);
  };

  const canStartJob = job?.status === 'assigned' || job?.status === 'in_progress';
  const canReverseJob = job?.status === 'in_progress' || job?.status === 'completed';
  const canCancelJob = job?.status === 'assigned' || job?.status === 'in_progress';

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
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="outline"
                    disabled={updateJobMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={form.handleSubmit(handleSave)}
                    size="sm"
                    disabled={updateJobMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {updateJobMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
              {canStartJob && !isEditing && (
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
              {canReverseJob && !isEditing && (
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
              {canCancelJob && !isEditing && (
                <Button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={statusUpdateMutation.isPending}
                  size="sm"
                  variant="destructive"
                >
                  <Ban className="w-4 h-4 mr-1" />
                  Cancel Job
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
            <Form {...form}>
              <form className="space-y-4">
                {/* Schedule Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarDays className="w-4 h-4" />
                      Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        {/* Job Type Field */}
                        <FormField
                          control={form.control}
                          name="job_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select job type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {jobTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Date Field */}
                        <FormField
                          control={form.control}
                          name="scheduled_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Scheduled Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        formatDateSafe(field.value, 'long')
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value ? (() => {
                                      const [year, month, day] = field.value.split('-').map(Number);
                                      return new Date(year, month - 1, day);
                                    })() : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        field.onChange(formatDateForQuery(date));
                                      }
                                    }}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    className="rounded-md pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Time Field */}
                        <FormField
                          control={form.control}
                          name="scheduled_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Scheduled Time (Optional)</FormLabel>
                              <FormControl>
                                <TimePicker
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <p className="text-sm">{job?.scheduled_date ? formatDateSafe(job.scheduled_date, 'long') : 'Not scheduled'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Time</label>
                            <p className="text-sm">{job?.scheduled_time || 'Not scheduled'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Job Type</label>
                          <p className="text-sm capitalize">{jobTypes.find(t => t.value === job?.job_type)?.label || 'Not specified'}</p>
                        </div>
                      </>
                    )}
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
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        {/* Driver Field */}
                        <FormField
                          control={form.control}
                          name="driver_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Driver</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value === "unassigned" ? null : value)} value={field.value || "unassigned"}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select driver" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {drivers.map((driver) => (
                                    <SelectItem key={driver.id} value={driver.id}>
                                      {driver.first_name} {driver.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Vehicle Field */}
                        <FormField
                          control={form.control}
                          name="vehicle_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vehicle</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value === "unassigned" ? null : value)} value={field.value || "unassigned"}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {vehicles.map((vehicle) => (
                                    <SelectItem key={vehicle.id} value={vehicle.id}>
                                      {vehicle.license_plate} ({vehicle.vehicle_type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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

                {/* Special Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="w-4 h-4" />
                      Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="special_instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Add any special instructions for this job..."
                                {...field}
                                value={field.value || ''}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{job?.special_instructions || 'None'}</p>
                    )}
                  </CardContent>
                </Card>

                 {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Add any notes for this job..."
                                {...field}
                                value={field.value || ''}
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{job?.notes || 'None'}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Priority Toggle */}
                {isEditing && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Star className="w-4 h-4" />
                        Priority Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="is_priority"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Mark as Priority</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                This job will be highlighted with a priority badge
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
              </form>
            </Form>
          )}
        </div>
      </DialogContent>

      {/* Cancel Job Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="w-5 h-5" />
              Cancel Job
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this job? This action will mark the job as cancelled and cannot be undone.
              <br /><br />
              <strong>Job:</strong> {job?.job_number}
              <br />
              <strong>Customer:</strong> {job?.customer?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Job</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelJob}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={statusUpdateMutation.isPending}
            >
              {statusUpdateMutation.isPending ? 'Cancelling...' : 'Cancel Job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}