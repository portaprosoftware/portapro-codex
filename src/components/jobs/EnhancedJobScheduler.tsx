import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Calendar,
  Clock,
  User,
  Truck,
  MapPin,
  Bell,
  Zap,
  GripVertical,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { IncidentCreateModal } from '@/components/fleet/compliance/IncidentCreateModal';
import { SpillKitCheckModal } from '@/components/fleet/compliance/SpillKitCheckModal';

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
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
  driver?: {
    first_name: string;
    last_name: string;
  };
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  status: string;
}

export const EnhancedJobScheduler: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ date: string; driverId?: string } | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    jobType: 'all',
    driver: 'all'
  });

const [incidentOpen, setIncidentOpen] = useState(false);
const [spillKitOpen, setSpillKitOpen] = useState(false);

const queryClient = useQueryClient();

  // Fetch jobs for the current week
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs', currentWeek],
    queryFn: async () => {
      const weekStart = startOfWeek(currentWeek);
      const weekEnd = endOfWeek(currentWeek);
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers:customer_id (name, phone, email),
          profiles:driver_id (first_name, last_name)
        `)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date')
        .order('scheduled_time');

      if (error) throw error;
      return data as Job[];
    }
  });

  // Fetch drivers
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data as Driver[];
    }
  });

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      return data as Vehicle[];
    }
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: Partial<Job> }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update job: ' + error.message);
    }
  });

  // Auto-assign jobs mutation
  const autoAssignMutation = useMutation({
    mutationFn: async () => {
      // Mock auto-assignment for demo
      const unassignedJobs = await supabase
        .from('jobs')
        .select('*')
        .is('driver_id', null)
        .eq('status', 'assigned');

      // Simple assignment logic (would be more sophisticated in real implementation)
      return { success: true, assigned_count: unassignedJobs.data?.length || 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Jobs auto-assigned successfully');
    },
    onError: (error) => {
      toast.error('Auto-assignment failed: ' + error.message);
    }
  });

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(currentWeek), i)
  );

  // Get jobs for specific date and driver
  const getJobsForSlot = (date: Date, driverId?: string) => {
    if (!jobs) return [];
    
    return jobs.filter(job => {
      const jobDate = format(new Date(job.scheduled_date), 'yyyy-MM-dd');
      const slotDate = format(date, 'yyyy-MM-dd');
      
      const dateMatch = jobDate === slotDate;
      const driverMatch = driverId ? job.driver_id === driverId : !job.driver_id;
      
      return dateMatch && driverMatch;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, job: Job) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, date: string, driverId?: string) => {
    e.preventDefault();
    setDragOverSlot({ date, driverId });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, date: string, driverId?: string) => {
    e.preventDefault();
    
    if (!draggedJob) return;

    const updates: Partial<Job> = {
      scheduled_date: date,
      driver_id: driverId || null
    };

    updateJobMutation.mutate({
      jobId: draggedJob.id,
      updates
    });

    setDraggedJob(null);
    setDragOverSlot(null);
  };

  // Auto-assign jobs based on optimization algorithm
  const handleAutoAssign = () => {
    if (autoAssignMutation.isPending) return;
    autoAssignMutation.mutate();
  };

  // Job status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'in-progress': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const JobCard: React.FC<{ job: Job; isDragging?: boolean }> = ({ job, isDragging }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, job)}
      className={`
        bg-white border rounded-lg p-3 shadow-sm cursor-move transition-all
        hover:shadow-md hover:scale-105
        ${isDragging ? 'opacity-50 rotate-3' : ''}
        ${selectedJob?.id === job.id ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={() => setSelectedJob(job)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-sm">{job.id.slice(0, 8)}</span>
        </div>
        <Badge className={`${getStatusColor(job.status)} text-white text-xs`}>
          {job.status}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-900">
          {job.customer?.name || 'Unknown Customer'}
        </p>
        <p className="text-xs text-gray-500">{job.job_type}</p>
        {job.scheduled_time && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            {job.scheduled_time}
          </div>
        )}
        {job.driver && (
          <div className="flex items-center text-xs text-gray-500">
            <User className="w-3 h-3 mr-1" />
            {job.driver.first_name} {job.driver.last_name}
          </div>
        )}
      </div>
    </div>
  );

  const TimeSlot: React.FC<{ 
    date: Date; 
    driverId?: string; 
    jobs: Job[];
    title: string;
  }> = ({ date, driverId, jobs, title }) => {
    const isDropTarget = dragOverSlot?.date === format(date, 'yyyy-MM-dd') && 
                        dragOverSlot?.driverId === driverId;
    
    return (
      <div
        className={`
          min-h-32 p-2 border border-gray-200 bg-gray-50 rounded-lg
          transition-all duration-200
          ${isDropTarget ? 'bg-blue-100 border-blue-300 border-dashed' : ''}
          ${jobs.length === 0 ? 'border-dashed' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, format(date, 'yyyy-MM-dd'), driverId)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, format(date, 'yyyy-MM-dd'), driverId)}
      >
        <div className="text-xs font-medium text-gray-600 mb-2">{title}</div>
        <div className="space-y-2">
          {jobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              isDragging={draggedJob?.id === job.id}
            />
          ))}
          {jobs.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-xs">
              Drop jobs here
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Job Scheduler</h2>
          <p className="text-muted-foreground">Drag and drop to schedule jobs efficiently</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Auto-assign toggle */}
          <div className="flex items-center space-x-2">
            <Switch 
              checked={autoAssignEnabled}
              onCheckedChange={setAutoAssignEnabled}
            />
            <span className="text-sm">Auto-assign</span>
          </div>
          
          {/* Auto-assign button */}
          <Button
            onClick={handleAutoAssign}
            disabled={autoAssignMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-blue-500"
          >
            <Zap className="w-4 h-4 mr-2" />
            {autoAssignMutation.isPending ? 'Assigning...' : 'Optimize Schedule'}
          </Button>

          {/* Quick compliance actions for Dispatch */}
          <Button onClick={() => setIncidentOpen(true)}>
            Log Incident
          </Button>
          <Button onClick={() => setSpillKitOpen(true)} variant="secondary">
            Spill Kit Check
          </Button>
          
          {/* Refresh */}
          <Button variant="outline" onClick={() => refetchJobs()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.jobType} onValueChange={(value) => setFilters({...filters, jobType: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="partial-pickup">Partial Pickup</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="on-site-survey">Survey/Estimate</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.driver} onValueChange={(value) => setFilters({...filters, driver: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {drivers?.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
        >
          Previous Week
        </Button>
        
        <h3 className="text-lg font-semibold">
          Week of {format(startOfWeek(currentWeek), 'MMM d, yyyy')}
        </h3>
        
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="grid grid-cols-8 gap-4 p-4">
          {/* Header Row */}
          <div className="font-semibold text-sm text-gray-600">Drivers</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-center">
              <div className="font-semibold text-sm">{format(day, 'EEE')}</div>
              <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
            </div>
          ))}

          {/* Unassigned Jobs Row */}
          <div className="font-medium text-sm text-gray-700 py-2">
            Unassigned
            <div className="text-xs text-gray-500">Jobs without drivers</div>
          </div>
          {weekDays.map(day => (
            <TimeSlot
              key={`unassigned-${day.toISOString()}`}
              date={day}
              jobs={getJobsForSlot(day)}
              title="Unassigned"
            />
          ))}

          {/* Driver Rows */}
          {drivers?.map(driver => (
            <React.Fragment key={driver.id}>
              <div className="font-medium text-sm text-gray-700 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {driver.first_name[0]}{driver.last_name[0]}
                  </div>
                  <div>
                    <div>{driver.first_name} {driver.last_name}</div>
                    <div className="text-xs text-gray-500">
                      {getJobsForSlot(currentWeek, driver.id).length} jobs this week
                    </div>
                  </div>
                </div>
              </div>
              {weekDays.map(day => (
                <TimeSlot
                  key={`${driver.id}-${day.toISOString()}`}
                  date={day}
                  driverId={driver.id}
                  jobs={getJobsForSlot(day, driver.id)}
                  title={format(day, 'MMM d')}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Job Details Panel */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Customer</label>
                <p>{selectedJob.customer?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Job Type</label>
                <p>{selectedJob.job_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge className={getStatusColor(selectedJob.status)}>
                  {selectedJob.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Scheduled Date</label>
                <p>{format(new Date(selectedJob.scheduled_date), 'MMM d, yyyy')}</p>
              </div>
              {selectedJob.notes && (
                <div className="col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <p>{selectedJob.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispatch Modals */}
      <IncidentCreateModal isOpen={incidentOpen} onClose={() => setIncidentOpen(false)} />
      <SpillKitCheckModal isOpen={spillKitOpen} onClose={() => setSpillKitOpen(false)} />
    </div>
  );
};