import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  MapPin, 
  Clock, 
  User, 
  Truck, 
  Phone, 
  MessageSquare, 
  Navigation, 
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Calendar,
  Route
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

interface JobUpdate {
  id: string;
  job_id: string;
  status: string;
  location: any;
  timestamp: string;
  notes?: string;
  photo_url?: string;
}

interface Job {
  id: string;
  customer_id: string;
  driver_id?: string;
  vehicle_id?: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  job_number: string;
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
  driver?: {
    first_name: string;
    last_name: string;
  };
  updates?: JobUpdate[];
}

export const RealTimeJobTracking: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'scheduled'>('active');
  const [realTimeUpdates, setRealTimeUpdates] = useState<JobUpdate[]>([]);

  const queryClient = useQueryClient();

  // Fetch jobs with real-time updates
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs-tracking', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          customers:customer_id (name, phone, email),
          profiles:driver_id (first_name, last_name)
        `);

      switch (activeTab) {
        case 'active':
          query = query.in('status', ['assigned', 'in_progress']);
          break;
        case 'completed':
          query = query.eq('status', 'completed');
          break;
        case 'scheduled':
          query = query.eq('status', 'assigned');
          break;
      }

      const { data, error } = await query
        .order('scheduled_date')
        .order('scheduled_time');

      if (error) throw error;
      return data as Job[];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Update job status mutation
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, status, notes }: { jobId: string; status: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(notes && { notes })
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;

      // Create a notification instead of job note (since job_notes table structure is different)
      const { error: noteError } = await supabase
        .from('notification_logs')
        .insert({
          user_id: 'system',
          notification_type: 'job_status_update',
          title: 'Job Status Updated',
          body: notes || `Status changed to ${status}`,
          data: { job_id: jobId, old_status: 'previous', new_status: status }
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs-tracking'] });
      toast.success('Job status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update job status: ' + error.message);
    }
  });

  // Real-time subscription for job updates
  useEffect(() => {
    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        (payload) => {
          console.log('Job update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['jobs-tracking'] });
          
          // Show toast notification for status changes
          if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old?.status) {
            toast.info(`Job ${payload.new.job_number} status updated to ${payload.new.status}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs'
        },
        (payload) => {
          console.log('Notification received:', payload);
          // Add to real-time updates
          if (payload.new.notification_type === 'job_status_update') {
            setRealTimeUpdates(prev => [payload.new as any, ...prev.slice(0, 49)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get job status color and icon
  const getJobStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return { color: 'bg-blue-500', icon: Calendar, text: 'Assigned' };
      case 'in_progress':
        return { color: 'bg-orange-500', icon: PlayCircle, text: 'In Progress' };
      case 'completed':
        return { color: 'bg-green-500', icon: CheckCircle, text: 'Completed' };
      case 'cancelled':
        return { color: 'bg-red-500', icon: AlertTriangle, text: 'Cancelled' };
      default:
        return { color: 'bg-gray-500', icon: Clock, text: status };
    }
  };

  // Calculate job progress
  const calculateJobProgress = (job: Job) => {
    const now = new Date();
    const scheduled = new Date(job.scheduled_date + ' ' + (job.scheduled_time || '09:00'));
    const endOfDay = new Date(scheduled);
    endOfDay.setHours(17, 0, 0, 0); // Assume 8-hour work day

    if (job.status === 'completed') return 100;
    if (job.status === 'assigned' && now < scheduled) return 0;
    
    const totalMinutes = differenceInMinutes(endOfDay, scheduled);
    const elapsedMinutes = differenceInMinutes(now, scheduled);
    
    return Math.min(Math.max((elapsedMinutes / totalMinutes) * 100, 0), 100);
  };

  // Handle status updates
  const handleStatusUpdate = (jobId: string, newStatus: string) => {
    updateJobStatusMutation.mutate({ jobId, status: newStatus });
  };

  const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const statusConfig = getJobStatusConfig(job.status);
    const StatusIcon = statusConfig.icon;
    const progress = calculateJobProgress(job);

    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedJob?.id === job.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => setSelectedJob(job)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <StatusIcon className="w-4 h-4" />
              <span className="font-semibold">{job.id.slice(0, 8)}</span>
            </div>
            <Badge className={`${statusConfig.color} text-white`}>
              {statusConfig.text}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div>
            <div className="font-medium">{job.customer?.name}</div>
            <div className="text-sm text-gray-500">{job.job_type}</div>
          </div>

          {job.driver && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2" />
              {job.driver.first_name} {job.driver.last_name}
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
            {job.scheduled_time && ` at ${job.scheduled_time}`}
          </div>

          {job.status === 'in_progress' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            {job.status === 'assigned' && (
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(job.id, 'in_progress');
                }}
                className="flex-1"
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            
            {job.status === 'in_progress' && (
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(job.id, 'completed');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </Button>
            )}

            {job.customer?.phone && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${job.customer?.phone}`);
                }}
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Job Tracking</h2>
          <p className="text-muted-foreground">Monitor job progress and updates in real-time</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Updates
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'active', label: 'Active Jobs', count: jobs?.filter(j => ['assigned', 'in_progress'].includes(j.status)).length },
          { key: 'scheduled', label: 'Scheduled', count: jobs?.filter(j => j.status === 'assigned').length },
          { key: 'completed', label: 'Completed', count: jobs?.filter(j => j.status === 'completed').length }
        ].map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.key as any)}
            className={`
              flex-1 relative
              ${activeTab === tab.key ? 'bg-white shadow-sm' : ''}
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tab.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs && jobs.length > 0 ? (
            jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No {activeTab} jobs</h3>
                <p className="text-gray-400">Jobs will appear here when available</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Job Details Panel */}
        <div className="space-y-4">
          {selectedJob ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Job Number</label>
                    <p className="font-semibold">{selectedJob.id.slice(0, 8)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p>{selectedJob.customer?.name}</p>
                    {selectedJob.customer?.phone && (
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">{selectedJob.customer.phone}</span>
                      </div>
                    )}
                  </div>

                  {selectedJob.driver && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Driver</label>
                      <p>{selectedJob.driver.first_name} {selectedJob.driver.last_name}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Scheduled</label>
                    <p>{format(new Date(selectedJob.scheduled_date), 'MMM d, yyyy')}</p>
                    {selectedJob.scheduled_time && (
                      <p className="text-sm text-gray-600">{selectedJob.scheduled_time}</p>
                    )}
                  </div>

                  {selectedJob.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-sm">{selectedJob.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    View on Map
                  </Button>
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Route className="w-4 h-4 mr-2" />
                    Optimize Route
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500">Select a Job</h3>
                <p className="text-gray-400">Choose a job to view details and actions</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realTimeUpdates.slice(0, 5).map((update, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">{(update as any).body || update.notes || 'Status updated'}</p>
                      <p className="text-gray-500 text-xs">
                        {format(new Date(update.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {realTimeUpdates.length === 0 && (
                  <p className="text-gray-500 text-sm">No recent updates</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};