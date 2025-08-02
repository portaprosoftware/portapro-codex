import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Truck, 
  Edit3, 
  Save, 
  X,
  Phone,
  Mail,
  MessageSquare,
  Trash2,
  MoreVertical,
  Play,
  CheckCircle,
  Undo2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';

interface JobDetailModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  jobId,
  open,
  onOpenChange
}) => {
  const [editingSections, setEditingSections] = useState<{[key: string]: boolean}>({});
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers!inner(id, name, email, phone, service_street, service_city, service_state, service_zip),
          profiles:driver_id(id, first_name, last_name, email),
          vehicles(id, license_plate, vehicle_type)
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!jobId && open
  });

  // Fetch drivers and vehicles for editing
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: Object.values(editingSections).some(Boolean)
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: Object.values(editingSections).some(Boolean)
  });

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: '',
    scheduled_time: '',
    status: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    driver_id: '',
    vehicle_id: ''
  });

  const [notesForm, setNotesForm] = useState({
    notes: '',
    special_instructions: ''
  });

  // Initialize forms when job data loads
  React.useEffect(() => {
    if (job) {
      setScheduleForm({
        scheduled_date: job.scheduled_date || '',
        scheduled_time: job.scheduled_time || '',
        status: job.status || ''
      });
      setAssignmentForm({
        driver_id: job.driver_id || 'unassigned',
        vehicle_id: job.vehicle_id || 'unassigned'
      });
      setNotesForm({
        notes: job.notes || '',
        special_instructions: job.special_instructions || ''
      });
    }
  }, [job]);

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (payload: { updates: any; section: string; sectionName: string }) => {
      if (!jobId) throw new Error('No job ID');
      
      const { data, error } = await supabase
        .from('jobs')
        .update(payload.updates)
        .eq('id', jobId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, section: payload.section, sectionName: payload.sectionName };
    },
    onSuccess: (result) => {
      toast({
        title: "Job Updated",
        description: `${result.sectionName} updated successfully`,
      });
      setEditingSections(prev => ({ ...prev, [result.section]: false }));
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
      console.error('Job update error:', error);
    }
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('No job ID');
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Job Deleted",
        description: "Job has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
      console.error('Job delete error:', error);
    }
  });

  // Job status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      if (!jobId) throw new Error('No job ID');
      
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status,
          actual_completion_time: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Job Updated",
        description: "Job status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
      console.error('Job status update error:', error);
    }
  });

  // Section editing handlers
  const handleSectionEdit = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const handleSectionCancel = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: false }));
    // Reset form data
    if (job) {
      if (section === 'schedule') {
        setScheduleForm({
          scheduled_date: job.scheduled_date || '',
          scheduled_time: job.scheduled_time || '',
          status: job.status || ''
        });
      } else if (section === 'assignment') {
        setAssignmentForm({
          driver_id: job.driver_id || 'unassigned',
          vehicle_id: job.vehicle_id || 'unassigned'
        });
      } else if (section === 'notes') {
        setNotesForm({
          notes: job.notes || '',
          special_instructions: job.special_instructions || ''
        });
      }
    }
  };

  const handleSectionSave = (section: string) => {
    let updates = {};
    let sectionName = '';

    if (section === 'schedule') {
      updates = scheduleForm;
      sectionName = 'Schedule';
    } else if (section === 'assignment') {
      const processedForm = {
        driver_id: assignmentForm.driver_id === 'unassigned' ? null : assignmentForm.driver_id,
        vehicle_id: assignmentForm.vehicle_id === 'unassigned' ? null : assignmentForm.vehicle_id
      };
      updates = processedForm;
      sectionName = 'Assignment';
    } else if (section === 'notes') {
      updates = notesForm;
      sectionName = 'Notes';
    }

    updateJobMutation.mutate({
      updates,
      section,
      sectionName
    });
  };

  // Job action handlers
  const handleStartJob = () => {
    if (job?.status === 'assigned' || job?.status === 'unassigned') {
      statusUpdateMutation.mutate({ status: 'in_progress' });
    } else if (job?.status === 'in_progress') {
      statusUpdateMutation.mutate({ status: 'completed' });
    }
  };

  const handleReverseJob = () => {
    if (job?.status === 'completed') {
      statusUpdateMutation.mutate({ status: 'in_progress' });
    } else if (job?.status === 'in_progress') {
      statusUpdateMutation.mutate({ status: 'assigned' });
    }
  };

  const getJobButtonText = () => {
    if (!job) return '';
    switch (job.status) {
      case 'assigned':
      case 'unassigned':
        return 'Start Job';
      case 'in_progress':
        return 'Complete Job';
      case 'completed':
        return 'Job Complete';
      default:
        return 'Update Status';
    }
  };

  const isJobCompleted = job?.status === 'completed';
  const showReverseButton = job?.status === 'in_progress' || job?.status === 'completed';

  const jobTypeConfig = {
    delivery: {
      color: 'bg-[hsl(var(--status-delivery))]',
      label: 'Delivery'
    },
    pickup: {
      color: 'bg-[hsl(var(--status-pickup))]',
      label: 'Pickup'
    },
    'partial-pickup': {
      color: 'bg-[hsl(var(--status-partial-pickup))]',
      label: 'Partial Pickup'
    },
    service: {
      color: 'bg-[hsl(var(--status-service))]',
      label: 'Service'
    },
    'on-site-survey': {
      color: 'bg-[hsl(var(--status-survey))]',
      label: 'On-Site Survey/Estimate'
    },
    return: {
      color: 'bg-[hsl(var(--status-cancelled))]',
      label: 'Return'
    }
  };

  const getJobTypeColor = (type: string) => {
    return jobTypeConfig[type as keyof typeof jobTypeConfig]?.color || 'bg-gray-500';
  };

  if (!job && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-h-[90vh] max-w-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">
                {job?.job_number || 'Loading...'}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-2">
                {job && (
                  <>
                    {(() => {
                      const statusInfo = getDualJobStatusInfo(job);
                      return (
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusInfo.primary.gradient} text-white border-0 font-medium px-3 py-1 rounded-full text-xs`}>
                            {statusInfo.primary.label}
                          </Badge>
                          {statusInfo.secondary && (
                            <Badge className={`${statusInfo.secondary.gradient} text-white border-0 font-medium px-2 py-0.5 rounded-full text-xs`}>
                              {statusInfo.secondary.label}
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
                    <Badge className={cn("text-xs text-white rounded-full", getJobTypeColor(job.job_type))}>
                      {job.job_type.toUpperCase()}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white shadow-lg border z-[60]">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Job
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Job</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the job and all associated data.
                        <br /><br />
                        Type "delete" below to confirm:
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type 'delete' to confirm"
                      className="mt-2"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (deleteConfirmText === 'delete') {
                            deleteJobMutation.mutate();
                            setDeleteConfirmText('');
                          }
                        }}
                        disabled={deleteConfirmText !== 'delete' || deleteJobMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleteJobMutation.isPending ? 'Deleting...' : 'Delete Job'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading job details...</p>
            </div>
          </div>
        ) : job ? (
          <div className="overflow-y-auto flex-1 space-y-6 pr-2">
            {/* Job Information Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Schedule Information */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      Schedule
                    </CardTitle>
                    {!editingSections.schedule ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSectionEdit('schedule')}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSectionCancel('schedule')}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSectionSave('schedule')}
                          disabled={updateJobMutation.isPending}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingSections.schedule ? (
                    <>
                      <div>
                        <Label htmlFor="scheduled_date">Date</Label>
                        <Input
                          id="scheduled_date"
                          type="date"
                          value={scheduleForm.scheduled_date}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduled_time">Time</Label>
                        <Input
                          id="scheduled_time"
                          type="time"
                          value={scheduleForm.scheduled_time}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={scheduleForm.status} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg z-[60]">
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {format(new Date(job.scheduled_date), 'MMMM do, yyyy')}
                      </div>
                      {job.scheduled_time && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {job.scheduled_time}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Information */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Assignment
                    </CardTitle>
                    {!editingSections.assignment ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSectionEdit('assignment')}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSectionCancel('assignment')}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSectionSave('assignment')}
                          disabled={updateJobMutation.isPending}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingSections.assignment ? (
                    <>
                      <div>
                        <Label htmlFor="driver_id">Driver</Label>
                        <Select value={assignmentForm.driver_id} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, driver_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg z-[60]">
                            <SelectItem value="unassigned">No driver assigned</SelectItem>
                            {drivers.map(driver => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.first_name} {driver.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vehicle_id">Vehicle</Label>
                        <Select value={assignmentForm.vehicle_id} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, vehicle_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg z-[60]">
                            <SelectItem value="unassigned">No vehicle assigned</SelectItem>
                            {vehicles.map(vehicle => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.license_plate} ({vehicle.vehicle_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      {job.profiles ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          {job.profiles.first_name} {job.profiles.last_name}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No driver assigned</div>
                      )}
                      
                      {job.vehicles ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <Truck className="w-4 h-4 mr-2" />
                          {job.vehicles.license_plate} ({job.vehicles.vehicle_type})
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No vehicle assigned</div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Customer Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-lg font-semibold">{job.customers.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {job.customers.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{job.customers.email}</span>
                    </div>
                  )}
                  {job.customers.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{job.customers.phone}</span>
                    </div>
                  )}
                </div>
                
                {job.customers.service_street && (
                  <div>
                    <Label className="text-sm font-medium">Service Address</Label>
                    <div className="flex items-start space-x-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        {job.customers.service_street}<br />
                        {job.customers.service_city}, {job.customers.service_state} {job.customers.service_zip}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-4">
                  {job.customers.phone && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Customer
                    </Button>
                  )}
                  {job.customers.email && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Customer
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Notes & Instructions</CardTitle>
                  {!editingSections.notes ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSectionEdit('notes')}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSectionCancel('notes')}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSectionSave('notes')}
                        disabled={updateJobMutation.isPending}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingSections.notes ? (
                  <>
                    <div>
                      <Label htmlFor="notes">General Notes</Label>
                      <Textarea
                        id="notes"
                        value={notesForm.notes}
                        onChange={(e) => setNotesForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="General job notes..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="special_instructions">Special Instructions</Label>
                      <Textarea
                        id="special_instructions"
                        value={notesForm.special_instructions}
                        onChange={(e) => setNotesForm(prev => ({ ...prev, special_instructions: e.target.value }))}
                        placeholder="Special instructions for this job..."
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {job.notes ? (
                      <div>
                        <Label className="text-sm font-medium">General Notes</Label>
                        <p className="text-sm text-gray-600 mt-1">{job.notes}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No general notes</div>
                    )}
                    
                    {job.special_instructions ? (
                      <div>
                        <Label className="text-sm font-medium">Special Instructions</Label>
                        <p className="text-sm text-gray-600 mt-1">{job.special_instructions}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No special instructions</div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Action Buttons Footer */}
        {job && (
          <DialogFooter className="flex justify-between items-center pt-4 border-t bg-white sticky bottom-0 flex-shrink-0">
            {showReverseButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReverseJob}
                disabled={statusUpdateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Reverse Job
              </Button>
            )}
            
            <div className="flex space-x-2 ml-auto">
              <Button 
                size="sm" 
                onClick={handleStartJob}
                disabled={isJobCompleted || statusUpdateMutation.isPending}
                className={`${
                  isJobCompleted 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {statusUpdateMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  <>
                    {!isJobCompleted && (
                      job.status === 'in_progress' ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )
                    )}
                    {getJobButtonText()}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};