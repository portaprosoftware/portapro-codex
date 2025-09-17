import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import { formatDateForQuery, addDaysToDate, subtractDaysFromDate } from '@/lib/dateUtils';
import { Calendar as CalendarIcon, MapPin, ClipboardList, Search, Filter, AlertTriangle, User, Plus, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabNav } from '@/components/ui/TabNav';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import JobsMapPage from '@/components/JobsMapView';
import { JobsMapErrorBoundary } from '@/components/JobsMapErrorBoundary';
import { AddNewJobSlider } from '@/components/jobs/AddNewJobSlider';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { EquipmentAssignmentModal } from '@/components/jobs/EquipmentAssignmentModal';
import { JobCard } from '@/components/jobs/JobCard';
import { DispatchJobCard } from '@/components/jobs/DispatchJobCard';
import { DispatchJobCardList } from '@/components/jobs/DispatchJobCardList';
import { DispatchJobCardCompact } from '@/components/jobs/DispatchJobCardCompact';
import { EnhancedDateNavigator } from '@/components/jobs/EnhancedDateNavigator';
import { InlineFilters } from '@/components/jobs/InlineFilters';
import { useJobs, useUpdateJobStatus, useCreateJob } from '@/hooks/useJobs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { isJobOverdue, isJobCompletedLate, shouldShowWasOverdueBadge, shouldShowPriorityBadge } from '@/lib/jobStatusUtils';
import { useJobsWithDateRange } from '@/hooks/useJobsWithDateRange';
import { useJobSearch } from '@/hooks/useJobSearch';
import { EnhancedJobFilters } from '@/components/filters/EnhancedJobFilters';
import { CustomJobsList } from '@/components/jobs/CustomJobsList';
import { exportJobsToCSV, generatePDFContent } from '@/utils/jobsExport';
import { useUser } from '@clerk/clerk-react';
import { DateRange } from 'react-day-picker';
import { MapModeToggle } from '@/components/maps/MapModeToggle';
import { MapLegend } from '@/components/maps/MapLegend';
import { JobDraftManagement } from '@/components/jobs/JobDraftManagement';
import { useJobDrafts } from '@/hooks/useJobDrafts';
import { FilterToggle } from '@/components/jobs/FilterToggle';



const JobsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'calendar' | 'dispatch' | 'map' | 'custom' | 'drafts'>('calendar');
  // Unified date state for all views - using Date objects (converted to string at query boundary)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
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
  const [showCancelledJobs, setShowCancelledJobs] = useState(false);

  // Custom date range filters
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [customSearchTerm, setCustomSearchTerm] = useState('');
  const [customSelectedDriver, setCustomSelectedDriver] = useState('all');
  const [customSelectedJobType, setCustomSelectedJobType] = useState('all');
  const [customSelectedStatus, setCustomSelectedStatus] = useState('all');

  // Map-specific state
  const [isDriverMode, setIsDriverMode] = useState(false);

  // Job drafts
  const { drafts } = useJobDrafts();

  const updateJobStatusMutation = useUpdateJobStatus();
  const createJobMutation = useCreateJob();
  const queryClient = useQueryClient();
  const { toast: showToast } = useToast();

  // Smart job search for cross-date navigation - only trigger on Enter key
  const [shouldTriggerSmartSearch, setShouldTriggerSmartSearch] = useState(false);
  const searchLooksLikeJobId = searchTerm.length >= 6 && /^[A-Z]{3}-\d+$/i.test(searchTerm);
  const { data: foundJob } = useJobSearch(shouldTriggerSmartSearch && searchLooksLikeJobId ? searchTerm : undefined);

  // Handle smart job search and date navigation
  const handleSmartSearch = useCallback(() => {
    if (!foundJob) {
      console.log('No job found for search term:', searchTerm);
      toast.error(`Job ${searchTerm} not found`);
      setShouldTriggerSmartSearch(false);
      return;
    }
    
    console.log('Found job:', foundJob);
    console.log('Job scheduled_date from DB:', foundJob.scheduled_date);
    
    // Parse the date string properly to avoid timezone issues
    const jobDate = new Date(foundJob.scheduled_date + 'T00:00:00');
    console.log('Parsed job date:', jobDate);
    console.log('Job date getFullYear:', jobDate.getFullYear(), 'getMonth:', jobDate.getMonth() + 1, 'getDate:', jobDate.getDate());
    
    const currentDateStr = formatDateForQuery(selectedDate);
    const jobDateStr = formatDateForQuery(jobDate);
    
    console.log('Current date string:', currentDateStr);
    console.log('Job date string:', jobDateStr);
    console.log('Selected date object:', selectedDate);
    console.log('Selected date getFullYear:', selectedDate.getFullYear(), 'getMonth:', selectedDate.getMonth() + 1, 'getDate:', selectedDate.getDate());
    
    // Only navigate if job is found on a different date
    if (jobDateStr !== currentDateStr) {
      console.log('Navigating to job date:', jobDate);
      setSelectedDate(jobDate);
      toast.success(`Found job ${foundJob.job_number} on ${format(jobDate, 'MMM d, yyyy')} - navigating...`);
    } else {
      toast.success(`Found job ${foundJob.job_number} on current date`);
    }
    setShouldTriggerSmartSearch(false);
  }, [foundJob, selectedDate, toast, searchTerm]);

  // Handle Enter key for smart search
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchLooksLikeJobId && activeTab !== 'custom') {
      setShouldTriggerSmartSearch(true);
    }
  }, [searchLooksLikeJobId, activeTab]);

  // Trigger smart search when job is found
  useEffect(() => {
    if (foundJob && shouldTriggerSmartSearch) {
      handleSmartSearch();
    }
  }, [foundJob, shouldTriggerSmartSearch, handleSmartSearch]);

  // Mutation to update job assignment
  const updateJobAssignmentMutation = useMutation({
    mutationFn: async ({ jobId, driverId }: { jobId: string; driverId: string | null }) => {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          driver_id: driverId,
          status: driverId ? 'assigned' : 'unassigned',
          updated_at: new Date().toISOString()
        })
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

  // Get jobs for all views using unified date (convert Date to string at query boundary)
  // Only pass database-queryable filters to the hook
  const { data: allJobsRaw = [] } = useJobs({
    date: formatDateForQuery(selectedDate), // Convert Date to string here
    job_type: selectedJobType !== 'all' ? selectedJobType : undefined,
    status: ['assigned', 'unassigned', 'in_progress', 'completed', 'cancelled'].includes(selectedStatus) ? selectedStatus : undefined,
    driver_id: selectedDriver !== 'all' ? selectedDriver : undefined
  });

  // Filter out cancelled jobs by default (unless specifically filtering for them or toggle is on)
  const allJobs = React.useMemo(() => {
    if (selectedStatus === 'cancelled' || showCancelledJobs) {
      return allJobsRaw; // Show cancelled jobs when specifically filtered or toggle is on
    }
    return allJobsRaw.filter(job => job.status !== 'cancelled');
  }, [allJobsRaw, selectedStatus, showCancelledJobs]);

  // Count cancelled jobs for the toggle
  const cancelledJobsCount = React.useMemo(() => {
    return allJobsRaw.filter(job => job.status === 'cancelled').length;
  }, [allJobsRaw]);

  // Separate jobs by type for calendar view
  const outgoingJobs = allJobs.filter(job => 
    ['delivery', 'service', 'on-site-survey'].includes(job.job_type)
  );

  const incomingJobs = allJobs.filter(job => 
    ['pickup', 'partial-pickup'].includes(job.job_type)
  );

  // All jobs for dispatch view
  const dispatchJobs = allJobs;

  // Custom date range jobs
  const { data: customJobsRaw = [] } = useJobsWithDateRange({
    startDate: customDateRange?.from ? formatDateForQuery(customDateRange.from) : undefined,
    endDate: customDateRange?.to ? formatDateForQuery(customDateRange.to) : undefined,
    job_type: customSelectedJobType !== 'all' ? customSelectedJobType : undefined,
    status: ['assigned', 'unassigned', 'in_progress', 'completed', 'cancelled'].includes(customSelectedStatus) ? customSelectedStatus : undefined,
    driver_id: customSelectedDriver !== 'all' ? customSelectedDriver : undefined,
    job_id: customSearchTerm || undefined
  });

  // Filter out cancelled jobs from custom view by default (unless specifically filtering for them)
  const customJobs = React.useMemo(() => {
    if (customSelectedStatus === 'cancelled') {
      return customJobsRaw; // Show cancelled jobs when specifically filtered
    }
    return customJobsRaw.filter(job => job.status !== 'cancelled');
  }, [customJobsRaw, customSelectedStatus]);

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

  // Calculate drivers with jobs for the selected date (not just today)
  const selectedDateFormatted = formatDateForQuery(selectedDate);
  const driversWithJobsToday = React.useMemo(() => {
    const driverSet = new Set<string>();
    
    // Check jobs for the selected date
    allJobs.forEach(job => {
      if (job.driver_id && format(new Date(job.scheduled_date), 'yyyy-MM-dd') === selectedDateFormatted) {
        driverSet.add(job.driver_id);
      }
    });
    
    return driverSet;
  }, [allJobs, selectedDateFormatted]);

  // Set the active tab based on route and force reinitialization
  useEffect(() => {
    if (location.pathname.includes('/calendar')) {
      setActiveTab('calendar');
    } else if (location.pathname.includes('/dispatch')) {
      setActiveTab('dispatch');
    } else if (location.pathname.includes('/map')) {
      setActiveTab('map');
    } else if (location.pathname.includes('/custom')) {
      setActiveTab('custom');
    } else if (location.pathname.includes('/drafts')) {
      setActiveTab('drafts');
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

  const navigateToTab = (tab: 'calendar' | 'dispatch' | 'map' | 'custom' | 'drafts') => {
    setActiveTab(tab);
    navigate(`/jobs/${tab}`);
  };

  // Filter custom jobs with badge-based filtering
  const filterCustomJobs = (jobs: any[]) => {
    return jobs.filter(job => {
      // Handle badge-based status filters client-side for custom view
      const matchesStatus = customSelectedStatus === 'all' || 
        job.status === customSelectedStatus ||
        (customSelectedStatus === 'priority' && shouldShowPriorityBadge(job)) ||
        (customSelectedStatus === 'was_overdue' && shouldShowWasOverdueBadge(job)) ||
        (customSelectedStatus === 'overdue' && isJobOverdue(job)) ||
        (customSelectedStatus === 'completed_late' && isJobCompletedLate(job));
      
      return matchesStatus;
    });
  };

  const handleCustomExport = () => {
    const filteredJobs = filterCustomJobs(customJobs);
    const dateRangeLabel = customDateRange?.from && customDateRange?.to 
      ? `${formatDateForQuery(customDateRange.from)}_to_${formatDateForQuery(customDateRange.to)}`
      : 'custom-date-range';
    
    exportJobsToCSV(filteredJobs, `jobs-export-${dateRangeLabel}`);
  };

  const handleJobView = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsJobDetailOpen(true);
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
      
      // Handle badge-based status filters client-side
      const matchesStatus = selectedStatus === 'all' || 
        job.status === selectedStatus ||
        (selectedStatus === 'priority' && shouldShowPriorityBadge(job)) ||
        (selectedStatus === 'was_overdue' && shouldShowWasOverdueBadge(job)) ||
        (selectedStatus === 'overdue' && isJobOverdue(job)) ||
        (selectedStatus === 'completed_late' && isJobCompletedLate(job));
      
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
      <div className={cn("max-w-none px-6 py-6 space-y-6", activeTab === "dispatch" && "space-y-3")}>
        {/* Page Header with Navigation Pills */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Jobs</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Schedule and manage job assignments</p>
            </div>
            
            {/* Jobs Sub-Navigation Pills */}
            <div className="flex items-center justify-between">
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
                  <TabNav.Item 
                    to="/jobs/custom" 
                    isActive={activeTab === 'custom'}
                    onClick={() => navigateToTab('custom')}
                  >
                    <Filter className="w-4 h-4" />
                    Advanced Search
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/jobs/drafts" 
                    isActive={activeTab === 'drafts'}
                    onClick={() => navigateToTab('drafts')}
                  >
                    <FileText className="w-4 h-4" />
                    Drafts
                    {drafts.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {drafts.length}
                      </Badge>
                    )}
                  </TabNav.Item>
                </TabNav>
              </div>
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
        
        {/* Conditional Filters Bar */}
        {activeTab !== 'custom' && activeTab !== 'drafts' && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <InlineFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchKeyDown={handleSearchKeyDown}
                selectedDriver={selectedDriver}
                onDriverChange={setSelectedDriver}
                selectedJobType={selectedJobType}
                onJobTypeChange={setSelectedJobType}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                drivers={drivers}
                driversWithJobsToday={driversWithJobsToday}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                showDateNavigator={true}
              />
            </div>
          </div>
        )}

        {/* Enhanced Filters for Custom Tab */}
        {activeTab === 'custom' && (
          <EnhancedJobFilters
            dateRange={customDateRange}
            onDateRangeChange={setCustomDateRange}
            searchTerm={customSearchTerm}
            onSearchTermChange={setCustomSearchTerm}
            selectedDriver={customSelectedDriver}
            onDriverChange={setCustomSelectedDriver}
            selectedJobType={customSelectedJobType}
            onJobTypeChange={setCustomSelectedJobType}
            selectedStatus={customSelectedStatus}
            onStatusChange={setCustomSelectedStatus}
            drivers={drivers}
            jobs={filterCustomJobs(customJobs)}
            onExport={handleCustomExport}
            resultsCount={filterCustomJobs(customJobs).length}
            totalCount={customJobs.length}
          />
        )}

        {/* Content Area with Enhanced Spacing */}
        <div className={cn("space-y-4", activeTab === "dispatch" && "space-y-0")}>
          {activeTab === 'drafts' && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <JobDraftManagement />
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              {customDateRange?.from && customDateRange?.to ? (
                <CustomJobsList
                  jobs={filterCustomJobs(customJobs)}
                  onJobClick={handleJobView}
                />
              ) : (
                <Card className="p-8 text-center">
                  <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select a date range</h3>
                  <p className="text-muted-foreground">Choose a date range above to view jobs and apply filters.</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Going Out Card */}
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="enterprise-card-title mb-0">Going Out ({filterJobs(outgoingJobs).length})</h3>
                      </div>
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
            </div>
          )}
          
          {activeTab === 'dispatch' && (
            <DragDropContext 
              onDragEnd={handleDragEnd}
              key={`drag-context-${dragContextKey}`}
            >
              <div className="min-h-screen">
                {/* Date Header - Fixed at top */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 sticky top-0 z-30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <span className="text-sm text-gray-600">{dispatchJobs.length} jobs scheduled</span>
                    </div>
                    <FilterToggle
                      showCancelled={showCancelledJobs}
                      onToggle={setShowCancelledJobs}
                      cancelledCount={cancelledJobsCount}
                    />
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-[300px_1fr] gap-4">
                  
                  {/* Left Column - Unassigned Jobs */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    
                    {/* Scrollable Unassigned Jobs List */}
                    <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
                      {/* Unassigned Jobs Title */}
                      <div className="p-4 border-b border-gray-200 bg-orange-50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-gray-900">Unassigned Jobs</span>
                          <Badge variant="secondary" className="text-xs">
                            {filterJobs(unassignedJobs).length}
                          </Badge>
                        </div>
                      </div>
                      <Droppable droppableId="unassigned" direction="vertical">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "p-4 min-h-[200px] transition-colors duration-200",
                              snapshot.isDraggingOver 
                                ? 'bg-orange-50 border-l-4 border-l-orange-500' 
                                : ''
                            )}
                          >
                            {filterJobs(unassignedJobs).length === 0 ? (
                              <div className="flex items-center justify-center h-32 text-gray-400">
                                <div className="text-center">
                                  <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">No unassigned jobs for {format(selectedDate, 'MMM d, yyyy')}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {filterJobs(unassignedJobs).map((job, index) => (
                                  <Draggable key={job.id} draggableId={job.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging ? 'opacity-50' : ''}
                                      >
                                        <DispatchJobCardList
                                          job={job}
                                          onView={handleJobView}
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
                  </div>

                  {/* Right Column - Drivers & Assigned Jobs */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    
                    {/* Scrollable Drivers Content */}
                    <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
                      {/* Drivers Title */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-medium text-gray-900">Drivers</h3>
                      </div>
                      {drivers.map(driver => {
                        const driverJobs = filterJobs(getJobsByDriver(driver.id));
                        return (
                          <div key={driver.id} className="border-b border-gray-200 last:border-b-0">
                            {/* Driver Header */}
                            <div className="bg-gray-50 p-4 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {driver.first_name} {driver.last_name}
                                  </h4>
                                  <Badge 
                                    variant={driverJobs.length > 0 ? "default" : "secondary"}
                                    className="text-xs mt-1"
                                  >
                                    {driverJobs.length} jobs
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Job Assignment Area */}
                            <div className="min-h-[120px]">
                              <Droppable droppableId={driver.id} direction="vertical">
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                      "p-4 min-h-[120px] transition-colors duration-200",
                                      snapshot.isDraggingOver 
                                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                                        : 'hover:bg-gray-25'
                                    )}
                                  >
                                    {driverJobs.length === 0 ? (
                                      <div className="flex items-center justify-center h-full text-gray-400">
                                        <div className="text-center">
                                          <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                          <p className="text-sm">
                                            Drop jobs here to assign to {driver.first_name}
                                          </p>
                                        </div>
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
                                                <DispatchJobCardList
                                                  job={job}
                                                  onView={handleJobView}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </DragDropContext>
          )}
          
          {activeTab === 'map' && (
            <div className="flex gap-4" style={{ height: 'calc(100vh - 140px)' }}>
              {/* Left Sidebar - Map Controls */}
              <div className="w-80 space-y-4">
                {/* Map Mode Toggle */}
                <div className="bg-white rounded-lg border shadow-sm p-4">
                  <div className="space-y-3">
                    <MapModeToggle 
                      isDriverMode={isDriverMode}
                      onModeChange={setIsDriverMode}
                    />
                    <p className="text-sm text-gray-600">
                      Toggle between job type and driver assignment views. Use the filters above to narrow your results further.
                    </p>
                  </div>
                </div>
                
                {/* Map Legend */}
                <MapLegend 
                  isDriverMode={isDriverMode}
                  filteredJobsCount={filterJobs(allJobs).length}
                  availableDrivers={drivers}
                />
              </div>
              
              {/* Right Side - Map */}
              <div className="flex-1 rounded-lg overflow-hidden">
                <JobsMapErrorBoundary 
                  onRetry={() => {
                    console.log('Retrying map with fresh data');
                  }}
                >
                  <JobsMapPage
                    searchTerm={searchTerm}
                    selectedDriver={selectedDriver}
                    jobType={selectedJobType}
                    status={selectedStatus}
                    selectedDate={selectedDate}
                    isDriverMode={isDriverMode}
                    onMapModeChange={setIsDriverMode}
                  />
                </JobsMapErrorBoundary>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Job Creation Wizard */}
      <AddNewJobSlider 
        open={isJobWizardOpen}
        onOpenChange={setIsJobWizardOpen}
      />
      
      {/* Job Detail Modal */}
      <JobDetailModal
        jobId={selectedJobId}
        open={selectedJobId ? true : false}
        onOpenChange={(open) => {
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
