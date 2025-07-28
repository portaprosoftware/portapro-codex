import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import { formatDateForQuery, addDaysToDate, subtractDaysFromDate } from '@/lib/dateUtils';
import { Calendar as CalendarIcon, MapPin, ClipboardList, Search, Filter, AlertTriangle, User, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabNav } from '@/components/ui/TabNav';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import JobsMapPage from '@/components/JobsMapView';
import { EnhancedJobWizard } from '@/components/jobs/EnhancedJobWizard';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { EquipmentAssignmentModal } from '@/components/jobs/EquipmentAssignmentModal';
import { JobCard } from '@/components/jobs/JobCard';
import { DispatchJobCard } from '@/components/jobs/DispatchJobCard';
import { EnhancedDateNavigator } from '@/components/jobs/EnhancedDateNavigator';
import { InlineFilters } from '@/components/jobs/InlineFilters';
import { useJobs, useUpdateJobStatus, useCreateJob } from '@/hooks/useJobs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const JobsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'calendar' | 'dispatch' | 'map'>('calendar');
  const [selectedDateOut, setSelectedDateOut] = useState(new Date());
  const [selectedDateBack, setSelectedDateBack] = useState(new Date());
  const [dispatchDate, setDispatchDate] = useState(new Date());
  
  // Modal state
  const [isJobWizardOpen, setIsJobWizardOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const updateJobStatusMutation = useUpdateJobStatus();
  const createJobMutation = useCreateJob();
  const queryClient = useQueryClient();

  // Mutation to update job assignment
  const updateJobAssignmentMutation = useMutation({
    mutationFn: async ({ jobId, driverId }: { jobId: string; driverId: string | null }) => {
      const { error } = await supabase
        .from('jobs')
        .update({ driver_id: driverId })
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job assignment updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update job assignment');
      console.error('Job assignment error:', error);
    }
  });

  // Get jobs for calendar view
  const { data: outgoingJobs = [] } = useJobs({
    date: formatDateForQuery(selectedDateOut),
    job_type: selectedJobType !== 'all' ? selectedJobType : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    driver_id: selectedDriver !== 'all' ? selectedDriver : undefined
  });

  const { data: incomingJobs = [] } = useJobs({
    date: formatDateForQuery(selectedDateBack),
    job_type: 'pickup'
  });

  const { data: dispatchJobs = [] } = useJobs({
    date: formatDateForQuery(dispatchDate)
  });

  // Get drivers for filter
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate drivers with jobs today
  const today = format(new Date(), 'yyyy-MM-dd');
  const driversWithJobsToday = React.useMemo(() => {
    const driverSet = new Set<string>();
    
    // Check jobs from all sources for today's date
    [...outgoingJobs, ...incomingJobs, ...dispatchJobs].forEach(job => {
      if (job.driver_id && format(new Date(job.scheduled_date), 'yyyy-MM-dd') === today) {
        driverSet.add(job.driver_id);
      }
    });
    
    return driverSet;
  }, [outgoingJobs, incomingJobs, dispatchJobs, today]);

  // Set the active tab based on route and force reinitialization
  useEffect(() => {
    if (location.pathname.includes('/calendar')) {
      setActiveTab('calendar');
    } else if (location.pathname.includes('/dispatch')) {
      setActiveTab('dispatch');
    } else if (location.pathname.includes('/map')) {
      setActiveTab('map');
    } else if (location.pathname === '/jobs') {
      // Default to calendar view for /jobs route
      setActiveTab('calendar');
      navigate('/jobs/calendar', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Force refresh of drag context when returning to dispatch tab
  useEffect(() => {
    if (activeTab === 'dispatch') {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, queryClient]);

  // Create stable key for drag context that only changes when we actually need to reinitialize
  const [dragContextKey, setDragContextKey] = useState(0);
  
  useEffect(() => {
    if (activeTab === 'dispatch') {
      setDragContextKey(prev => prev + 1);
    }
  }, [activeTab]);

  const navigateToTab = (tab: 'calendar' | 'dispatch' | 'map') => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'calendar':
        navigate('/jobs/calendar');
        break;
      case 'dispatch':
        navigate('/jobs/dispatch');
        break;
      case 'map':
        navigate('/jobs/map');
        break;
      default:
        navigate('/jobs');
        break;
    }
  };

  const handleJobView = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsJobDetailOpen(true);
  };

  const handleJobStart = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsJobDetailOpen(true);
  };

  const handleJobStatusUpdate = (jobId: string, status: string) => {
    updateJobStatusMutation.mutate({ jobId, status });
  };

  const handleEquipmentAssign = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsEquipmentModalOpen(true);
  };

  // Handle drag and drop with error handling and validation
  const handleDragEnd = useCallback((result: DropResult) => {
    console.log('Drag operation completed:', result);
    console.log('Available dispatch jobs:', dispatchJobs.map(j => ({ id: j.id, job_number: j.job_number })));
    
    const { destination, source, draggableId } = result;

    // Check if drop destination exists
    if (!destination) {
      console.log('No destination - drag cancelled');
      return;
    }

    // Check if item was moved to same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('Same position - no change needed');
      return;
    }

    // Validate job exists in current data
    const jobExists = dispatchJobs.find(job => job.id === draggableId);
    if (!jobExists) {
      console.error('Job not found in dispatchJobs:', draggableId);
      console.error('Available job IDs:', dispatchJobs.map(j => j.id));
      toast.error('Job not found. Please refresh the page.');
      return;
    }

    const jobId = draggableId;
    const newDriverId = destination.droppableId === 'unassigned' ? null : destination.droppableId;
    
    console.log('Updating job assignment:', { 
      jobId, 
      from: source.droppableId, 
      to: destination.droppableId, 
      newDriverId,
      jobNumber: jobExists.job_number 
    });
    
    updateJobAssignmentMutation.mutate({ jobId, driverId: newDriverId });
  }, [updateJobAssignmentMutation, dispatchJobs]);

  // Filter jobs based on search and filters
  const filterJobs = (jobs: any[]) => {
    return jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customers.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDriver = selectedDriver === 'all' || job.driver_id === selectedDriver;
      const matchesJobType = selectedJobType === 'all' || job.job_type === selectedJobType;
      const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
      
      return matchesSearch && matchesDriver && matchesJobType && matchesStatus;
    });
  };

  // Get unassigned jobs for dispatch
  const unassignedJobs = dispatchJobs.filter(job => !job.driver_id);
  
  // Get jobs by driver for dispatch view
  const getJobsByDriver = (driverId: string) => {
    return dispatchJobs.filter(job => job.driver_id === driverId);
  };

  // Get job status counts
  const getJobStatusCounts = () => {
    const assigned = dispatchJobs.filter(job => job.driver_id && job.status === 'assigned').length;
    const inProgress = dispatchJobs.filter(job => job.status === 'in_progress').length;
    const completed = dispatchJobs.filter(job => job.status === 'completed').length;
    
    return { assigned, inProgress, completed };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
        {/* Page Header with Navigation Pills */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Jobs</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Schedule and manage job assignments</p>
            </div>
            
            {/* Jobs Sub-Navigation Pills */}
            <div className="flex items-center justify-between h-full">
              <div className="enterprise-tabs">
                <TabNav ariaLabel="Jobs views">
                  <TabNav.Item 
                    to="/jobs/calendar" 
                    isActive={activeTab === 'calendar'}
                    onClick={() => navigateToTab('calendar')}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Calendar
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/jobs/dispatch" 
                    isActive={activeTab === 'dispatch'}
                    onClick={() => navigateToTab('dispatch')}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Dispatch
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/jobs/map" 
                    isActive={activeTab === 'map'}
                    onClick={() => navigateToTab('map')}
                  >
                    <MapPin className="w-4 h-4" />
                    Map
                  </TabNav.Item>
                </TabNav>
              </div>
              <div className="flex items-center">
                <Button 
                  onClick={() => setIsJobWizardOpen(true)}
                  className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Job
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Bar - Locked to Second Card */}
        {(activeTab === 'calendar' || activeTab === 'dispatch') && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <InlineFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedDriver={selectedDriver}
                onDriverChange={setSelectedDriver}
                selectedJobType={selectedJobType}
                onJobTypeChange={setSelectedJobType}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                drivers={drivers}
                driversWithJobsToday={driversWithJobsToday}
              />
            </div>
          </div>
        )}

        {/* Content Area with Enhanced Spacing */}
        <div className="space-y-4">
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Going Out Card */}
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="enterprise-card-title mb-0">Going Out ({filterJobs(outgoingJobs).length})</h3>
                    </div>
                    <EnhancedDateNavigator
                      date={selectedDateOut}
                      onDateChange={setSelectedDateOut}
                      label="Going Out"
                    />
                  </div>
                </div>
                
                <div className="p-6">
                  {filterJobs(outgoingJobs).length > 0 ? (
                    <div className="space-y-4">
                      {filterJobs(outgoingJobs).map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onView={handleJobView}
                          onStart={handleJobStart}
                          onStatusUpdate={handleJobStatusUpdate}
                          onEquipmentAssign={handleEquipmentAssign}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="enterprise-empty-state">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-500 font-inter">No jobs scheduled</p>
                      <p className="text-sm text-gray-400 font-inter">No outgoing jobs for this date</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Coming Back Card */}
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="enterprise-card-title mb-0">Coming Back ({incomingJobs.length})</h3>
                    </div>
                    <EnhancedDateNavigator
                      date={selectedDateBack}
                      onDateChange={setSelectedDateBack}
                      label="Coming Back"
                    />
                  </div>
                </div>
                
                <div className="p-6">
                  {incomingJobs.length > 0 ? (
                    <div className="space-y-4">
                      {incomingJobs.map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onView={handleJobView}
                          onStart={handleJobStart}
                          onStatusUpdate={handleJobStatusUpdate}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="enterprise-empty-state">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-500 font-inter">No pickups scheduled</p>
                      <p className="text-sm text-gray-400 font-inter">No incoming jobs for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'dispatch' && (
            <DragDropContext 
              onDragEnd={handleDragEnd}
              key={`drag-context-${dragContextKey}`}
            >
              <div className="bg-white">
                {/* Dispatch Header */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="p-1">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-lg font-semibold text-gray-900">Dispatch Board</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1"
                        onClick={() => setDispatchDate(prev => subtractDaysFromDate(prev, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-medium text-sm text-gray-900">
                        {format(dispatchDate, 'MMMM do, yyyy')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1"
                        onClick={() => setDispatchDate(prev => addDaysToDate(prev, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Manage driver schedules and job assignments</p>
                </div>

                {/* Main Content */}
                <div className="flex">
                  {/* Left Sidebar - Unassigned Jobs */}
                  <div className="w-80 border-r border-gray-200">
                    {/* Unassigned Jobs */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-sm">Unassigned Jobs</span>
                        <Badge variant="secondary" className="text-xs">
                          {filterJobs(unassignedJobs).length}
                        </Badge>
                      </div>

                      <Droppable droppableId="unassigned">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "min-h-[200px] border-2 border-dashed rounded-lg p-2 droppable-area transition-all duration-200",
                              snapshot.isDraggingOver 
                                ? "border-orange-400 bg-orange-50 is-dragging-over" 
                                : "border-gray-300 bg-gray-50"
                            )}
                          >
                            {filterJobs(unassignedJobs).length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No unassigned jobs</p>
                                <p className="text-xs text-gray-400 mt-1">Drop jobs here to unassign</p>
                              </div>
                            ) : (
                              filterJobs(unassignedJobs).map((job, index) => (
                                <Draggable key={job.id} draggableId={job.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`mb-3 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                    >
                                       <DispatchJobCard
                                         job={job}
                                         onClick={() => handleJobView(job.id)}
                                         isDragging={snapshot.isDragging}
                                       />
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>

                  {/* Right Content - Dispatch Board */}
                  <div className="flex-1">
                    {/* Date and Status Bar */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">1 job</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>{getJobStatusCounts().assigned} Assigned</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span>{getJobStatusCounts().inProgress} In Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>{getJobStatusCounts().completed} Completed</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date Header */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {format(dispatchDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                        <span className="text-sm text-gray-600">1 job scheduled</span>
                      </div>
                    </div>

                    {/* Driver Columns */}
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-6">
                        {drivers.slice(0, 3).map(driver => {
                          const driverJobs = filterJobs(getJobsByDriver(driver.id));
                          
                          return (
                            <div key={driver.id} className="space-y-4">
                              {/* Driver Header */}
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {driver.first_name} {driver.last_name}
                                  </h4>
                                  <Badge 
                                    variant={driverJobs.length > 0 ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {driverJobs.length} assigned
                                  </Badge>
                                </div>
                              </div>

                              {/* Drop Zone */}
                              <Droppable droppableId={driver.id}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[300px] border-2 border-dashed rounded-lg p-4 ${
                                      snapshot.isDraggingOver 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 bg-gray-50'
                                    }`}
                                  >
                                    {driverJobs.length === 0 ? (
                                      <div className="text-center text-gray-400 py-12">
                                        <ClipboardList className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">
                                          Drop jobs here<br />
                                          to assign to {driver.first_name}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {driverJobs.map((job, index) => (
                                          <Draggable key={job.id} draggableId={job.id} index={index}>
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={snapshot.isDragging ? 'opacity-50' : ''}
                                              >
                                                 <DispatchJobCard
                                                   job={job}
                                                   onClick={() => handleJobView(job.id)}
                                                   isDragging={snapshot.isDragging}
                                                 />
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                      </div>
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DragDropContext>
          )}
          
          {activeTab === 'map' && (
            <div className="bg-white">
              {/* Map Filters */}
              <div className="border-b border-gray-200 p-4">
                <InlineFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedDriver={selectedDriver}
                  onDriverChange={setSelectedDriver}
                  selectedJobType={selectedJobType}
                  onJobTypeChange={setSelectedJobType}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  drivers={drivers}
                  driversWithJobsToday={driversWithJobsToday}
                />
              </div>
              <JobsMapPage 
                searchTerm={searchTerm}
                selectedDriver={selectedDriver}
                selectedJobType={selectedJobType}
                selectedStatus={selectedStatus}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Job Creation Wizard */}
      {isJobWizardOpen && (
        <EnhancedJobWizard 
          onComplete={(data) => {
            // Convert wizard data to job creation format
            const jobData = {
              customer_id: data.selectedCustomer?.id,
              job_type: data.jobType,
              scheduled_date: data.deliveryDate?.toISOString().split('T')[0] || 
                            data.serviceDate?.toISOString().split('T')[0] || 
                            new Date().toISOString().split('T')[0],
              scheduled_time: data.deliveryTime || data.serviceTime || '09:00',
              notes: data.specialInstructions || '',
              special_instructions: data.specialInstructions || '',
              driver_id: data.selectedDriver?.id,
              vehicle_id: data.selectedVehicle?.id,
              timezone: data.timezone || 'America/New_York',
              billing_method: data.consumablesBillingMethod || 'per-use',
              subscription_plan: data.subscriptionEnabled ? 'basic' : undefined,
              assigned_template_ids: data.selectedTemplateIds || [],
              default_template_id: data.defaultTemplateId || undefined,
              consumables_data: {
                billing_method: data.consumablesBillingMethod,
                selected_consumables: data.selectedConsumables,
                selected_bundle: data.selectedBundle,
                subscription_enabled: data.subscriptionEnabled
              }
            };

            createJobMutation.mutate(jobData);
            setIsJobWizardOpen(false);
          }}
          onCancel={() => setIsJobWizardOpen(false)}
        />
      )}
      
      {/* Job Detail Modal */}
      <JobDetailModal
        jobId={selectedJobId}
        open={isJobDetailOpen}
        onOpenChange={(open) => {
          setIsJobDetailOpen(open);
          if (!open) setSelectedJobId(null);
        }}
      />
      
      {/* Equipment Assignment Modal */}
      <EquipmentAssignmentModal
        jobId={selectedJobId}
        open={isEquipmentModalOpen}
        onOpenChange={(open) => {
          setIsEquipmentModalOpen(open);
          if (!open) setSelectedJobId(null);
        }}
      />
    </div>
  );
};

export default JobsPage;
