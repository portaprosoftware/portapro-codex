import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, ClipboardList, Search, Filter, AlertTriangle, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabNav } from '@/components/ui/TabNav';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import JobsMapPage from '@/components/JobsMapView';
import { JobCreationWizard } from '@/components/jobs/JobCreationWizard';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { EquipmentAssignmentModal } from '@/components/jobs/EquipmentAssignmentModal';
import { JobCard } from '@/components/jobs/JobCard';
import { FiltersFlyout } from '@/components/jobs/FiltersFlyout';
import { DateNavigator } from '@/components/jobs/DateNavigator';
import { useJobs, useUpdateJobStatus } from '@/hooks/useJobs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  // Get jobs for calendar view
  const { data: outgoingJobs = [] } = useJobs({
    date: format(selectedDateOut, 'yyyy-MM-dd'),
    job_type: selectedJobType !== 'all' ? selectedJobType : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    driver_id: selectedDriver !== 'all' ? selectedDriver : undefined
  });

  const { data: incomingJobs = [] } = useJobs({
    date: format(selectedDateBack, 'yyyy-MM-dd'),
    job_type: 'pickup'
  });

  const { data: dispatchJobs = [] } = useJobs({
    date: format(dispatchDate, 'yyyy-MM-dd')
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

  // Set the active tab based on route
  useEffect(() => {
    if (location.pathname.includes('/calendar')) {
      setActiveTab('calendar');
    } else if (location.pathname.includes('/map')) {
      setActiveTab('map');
    } else if (location.pathname === '/jobs') {
      setActiveTab('dispatch');
    }
  }, [location.pathname]);

  const navigateToTab = (tab: 'calendar' | 'dispatch' | 'map') => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'calendar':
        navigate('/jobs/calendar');
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

  return (
    <div className="container-modern py-6 space-y-6">
      <PageHeader title="Jobs" subtitle="Schedule and manage job assignments" />
      
      {/* Jobs Sub-Navigation */}
      <div className="flex justify-between items-center">
        <TabNav ariaLabel="Jobs views">
          <TabNav.Item 
            to="/jobs/calendar" 
            isActive={activeTab === 'calendar'}
            onClick={() => navigateToTab('calendar')}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar
          </TabNav.Item>
          <TabNav.Item 
            to="/jobs/dispatch" 
            isActive={activeTab === 'dispatch'}
            onClick={() => navigateToTab('dispatch')}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Dispatch
          </TabNav.Item>
          <TabNav.Item 
            to="/jobs/map" 
            isActive={activeTab === 'map'}
            onClick={() => navigateToTab('map')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Map
          </TabNav.Item>
        </TabNav>

        {/* Actions */}
        {activeTab === 'calendar' && (
          <div className="flex items-center space-x-3">
            <FiltersFlyout
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedDriver={selectedDriver}
              onDriverChange={setSelectedDriver}
              selectedJobType={selectedJobType}
              onJobTypeChange={setSelectedJobType}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              drivers={drivers}
            />
            <Button 
              onClick={() => setIsJobWizardOpen(true)}
              className="bg-gradient-to-r from-[#2F4F9A] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#2F4F9A] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Job
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Enhanced Calendar Header */}
          <div className="bg-gradient-to-r from-[#2F4F9A] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-bold">Going Out</h3>
                  <DateNavigator
                    date={selectedDateOut}
                    onDateChange={setSelectedDateOut}
                    label="Going Out"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <DateNavigator
                  date={selectedDateBack}
                  onDateChange={setSelectedDateBack}
                  label="Coming Back"
                />
                <h3 className="text-xl font-bold">Coming Back</h3>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Going Out Column */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mr-2"></div>
                    Outgoing Jobs ({filterJobs(outgoingJobs).length})
                  </h4>
                </div>
                
                <div className="p-4">
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
                    <div className="text-center py-12 text-gray-500">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No jobs scheduled</p>
                      <p className="text-sm">No outgoing jobs for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coming Back Column */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full mr-2"></div>
                    Incoming Jobs ({incomingJobs.length})
                  </h4>
                </div>
                
                <div className="p-4">
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
                    <div className="text-center py-12 text-gray-500">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No pickups scheduled</p>
                      <p className="text-sm">No incoming jobs for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'dispatch' && (
        <div className="flex gap-6">
          {/* Left Panel: Unassigned Jobs */}
          <div className="w-72 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold">Unassigned Jobs</h3>
              <Badge className="ml-2 bg-orange-500 text-white">{unassignedJobs.length}</Badge>
            </div>
            
            <div className="space-y-3">
              {unassignedJobs.map(job => (
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
            
            {unassignedJobs.length === 0 && (
              <div className="text-center py-10">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-500">No unassigned jobs</p>
                <p className="text-gray-400 text-sm">All jobs have been assigned to drivers</p>
              </div>
            )}
          </div>

          {/* Main Panel: Dispatch Board */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Dispatch Board</h2>
                  <p className="text-sm text-gray-600">Manage driver schedules and job assignments</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <DateNavigator
                    date={dispatchDate}
                    onDateChange={setDispatchDate}
                    label="Dispatch Date"
                  />
                </div>
              </div>
            </div>
            
            {/* Driver Columns */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                {drivers.slice(0, 3).map(driver => {
                  const driverJobs = getJobsByDriver(driver.id);
                  
                  return (
                    <div key={driver.id} className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {driver.first_name} {driver.last_name}
                            </h4>
                            <Badge className={driverJobs.length > 0 ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"}>
                              {driverJobs.length} assigned
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {driverJobs.map(job => (
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
                      
                      {driverJobs.length === 0 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <ClipboardList className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Drop jobs here to assign to {driver.first_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'map' && (
        <JobsMapPage />
      )}
      
      {/* Job Creation Wizard */}
      <JobCreationWizard 
        open={isJobWizardOpen}
        onOpenChange={setIsJobWizardOpen}
      />
      
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
