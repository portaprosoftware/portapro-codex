import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, ClipboardList, ChevronLeft, ChevronRight, Search, Filter, Eye, Play, X, AlertTriangle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import JobsMapPage from '@/components/JobsMapView';

// Sample data for demonstration
const mockJobs = [
  {
    id: 'DEL-824',
    customerId: 123,
    customerName: 'Hickory Hollow Farm',
    jobType: 'Delivery',
    status: 'assigned',
    driverId: 1,
    scheduledDate: new Date(2025, 6, 17), // July 17, 2025
    driverName: 'Grady Green',
    direction: 'out'
  },
  {
    id: 'SVC-941',
    customerId: 124,
    customerName: 'BlueWave Festival',
    jobType: 'Service',
    status: 'assigned',
    driverId: 2,
    scheduledDate: new Date(2025, 6, 17), // July 17, 2025
    driverName: 'Jason Wells',
    direction: 'out'
  },
  {
    id: 'PKP-122',
    customerId: 125,
    customerName: 'Mountain View Resort',
    jobType: 'Pickup',
    status: 'in_progress',
    driverId: 1,
    scheduledDate: new Date(2025, 6, 17), // July 17, 2025
    driverName: 'Grady Green',
    direction: 'back'
  },
  {
    id: 'SVC-051',
    customerId: 126,
    customerName: 'Cuyahoga Waste Services',
    jobType: 'Service',
    status: 'assigned',
    driverId: 1,
    scheduledDate: new Date(2025, 6, 22), // July 22, 2025
    driverName: 'Grady Green',
    direction: 'out'
  }
];

const JobsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'calendar' | 'dispatch' | 'map'>('calendar');
  const [selectedDateOut, setSelectedDateOut] = useState(new Date(2025, 6, 17)); // July 17, 2025
  const [selectedDateBack, setSelectedDateBack] = useState(new Date(2025, 6, 17)); // July 17, 2025
  const [dispatchDate, setDispatchDate] = useState(new Date(2025, 6, 22)); // July 22, 2025
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedVariation, setSelectedVariation] = useState('all');

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

  // Get jobs for specific date and direction
  const getJobsForDate = (date: Date, direction: 'out' | 'back') => {
    return mockJobs.filter(job => 
      format(new Date(job.scheduledDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      job.direction === direction
    );
  };

  // Get jobs for dispatch date
  const getJobsForDispatchDate = (date: Date) => {
    return mockJobs.filter(job => 
      format(new Date(job.scheduledDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const outgoingJobs = getJobsForDate(selectedDateOut, 'out');
  const incomingJobs = getJobsForDate(selectedDateBack, 'back');
  const dispatchJobs = getJobsForDispatchDate(dispatchDate);
  
  // Get unassigned jobs (jobs without driverId)
  const unassignedJobs = dispatchJobs.filter(job => !job.driverId);
  
  // Get jobs by driver
  const getJobsByDriver = (driverId: number) => {
    return dispatchJobs.filter(job => job.driverId === driverId);
  };

  const JobCard = ({ job }: { job: typeof mockJobs[0] }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="font-semibold text-gray-900">{job.id}</span>
        <Badge 
          className={cn(
            "text-white text-xs px-2 py-1 rounded-full",
            job.status === 'assigned' && "bg-[#3366FF]",
            job.status === 'in_progress' && "bg-[#FF9933]",
            job.status === 'completed' && "bg-[#33CC66]"
          )}
        >
          {job.status === 'assigned' && 'Assigned'}
          {job.status === 'in_progress' && 'In Progress'}
          {job.status === 'completed' && 'Completed'}
        </Badge>
      </div>
      
      <div className="mb-3">
        <p className="font-medium text-gray-900 mb-1">{job.customerName}</p>
        <p className="text-sm text-gray-600">{job.jobType}</p>
        <p className="text-sm text-gray-500 mt-1">Driver: {job.driverName}</p>
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1 text-sm">
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1 bg-gradient-to-r from-[#3366FF] to-[#6699FF] hover:from-[#2952CC] hover:to-[#5580E6] text-sm"
        >
          <Play className="w-4 h-4 mr-1" />
          Start
        </Button>
      </div>
    </div>
  );

  const DispatchJobCard = ({ job }: { job: typeof mockJobs[0] }) => (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-sm mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm">{job.id}</span>
        <Badge 
          className={cn(
            "text-xs px-2 py-1 rounded",
            job.status === 'assigned' && "bg-blue-500 text-white",
            job.status === 'in_progress' && "bg-amber-500 text-white",
            job.status === 'completed' && "bg-green-500 text-white"
          )}
        >
          {job.status === 'assigned' && 'Assigned'}
          {job.status === 'in_progress' && 'In Progress'}
          {job.status === 'completed' && 'Completed'}
        </Badge>
      </div>
      
      <div className="mb-3">
        <p className="font-medium text-sm mb-1">{job.customerName}</p>
        <p className="text-gray-300 text-xs">{job.jobType}</p>
      </div>
      
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full text-white border-white hover:bg-white hover:text-gray-900 text-xs">
          Start
        </Button>
        <Button variant="outline" size="sm" className="w-full text-white border-white hover:bg-white hover:text-gray-900 text-xs">
          View
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container-modern py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Dispatch and track driver schedules</p>
        </div>
        
        {/* View selector pills */}
        <div className="flex items-center space-x-2">
          <Button 
            variant={activeTab === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "rounded-full px-5",
              activeTab === 'calendar' && "bg-gradient-to-r from-blue-500 to-blue-600"
            )}
            onClick={() => navigateToTab('calendar')}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          
          <Button 
            variant={activeTab === 'dispatch' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "rounded-full px-5",
              activeTab === 'dispatch' && "bg-gradient-to-r from-blue-500 to-blue-600"
            )}
            onClick={() => navigateToTab('dispatch')}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Dispatch
          </Button>
          
          <Button 
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "rounded-full px-5",
              activeTab === 'map' && "bg-gradient-to-r from-blue-500 to-blue-600"
            )}
            onClick={() => navigateToTab('map')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Map
          </Button>
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search jobs..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <select 
                className="rounded-md border border-gray-300 p-2 text-sm"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="all">All Drivers</option>
                <option value="1">Grady Green</option>
                <option value="2">Jason Wells</option>
                <option value="3">Kygo Jones</option>
              </select>
              
              <select 
                className="rounded-md border border-gray-300 p-2 text-sm"
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
              >
                <option value="all">All Job Types</option>
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
                <option value="service">Service</option>
              </select>
              
              <select 
                className="rounded-md border border-gray-300 p-2 text-sm"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="all">All Products</option>
                <option value="standard">Standard Unit</option>
                <option value="deluxe">Deluxe Unit</option>
                <option value="sink">Hand Wash Station</option>
              </select>
              
              <select 
                className="rounded-md border border-gray-300 p-2 text-sm"
                value={selectedVariation}
                onChange={(e) => setSelectedVariation(e.target.value)}
              >
                <option value="all">All Variations</option>
                <option value="standard">Standard</option>
                <option value="ada">ADA Compliant</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Going Out Column */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white p-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Going Out</h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => setSelectedDateOut(subDays(selectedDateOut, 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <span className="font-medium px-3">
                      {format(selectedDateOut, 'MMM d, yyyy')}
                    </span>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => setSelectedDateOut(addDays(selectedDateOut, 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {outgoingJobs.length > 0 ? (
                  <div className="space-y-4">
                    {outgoingJobs.map(job => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No deliveries or services scheduled for this date</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coming Back Column */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white p-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Coming Back</h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => setSelectedDateBack(subDays(selectedDateBack, 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <span className="font-medium px-3">
                      {format(selectedDateBack, 'MMM d, yyyy')}
                    </span>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => setSelectedDateBack(addDays(selectedDateBack, 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {incomingJobs.length > 0 ? (
                  <div className="space-y-4">
                    {incomingJobs.map(job => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No pickups or returns scheduled for this date</p>
                  </div>
                )}
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
            
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                All ({unassignedJobs.length})
              </Button>
            </div>
            
            <div className="text-center py-10">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-500">No unassigned jobs</p>
              <p className="text-gray-400 text-sm">All jobs have been assigned to drivers</p>
            </div>
          </div>

          {/* Main Panel: Dispatch Board */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="mr-3">
                    <X className="w-4 h-4" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">Dispatch Board</h2>
                    <p className="text-sm text-gray-600">Manage driver schedules and job assignments</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Date Navigation */}
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDispatchDate(subDays(dispatchDate, 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                      {format(dispatchDate, 'MMMM do, yyyy')}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDispatchDate(addDays(dispatchDate, 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="default"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    + Schedule
                  </Button>
                </div>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search by customer, job type, or driver..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Filter Pills and Driver Dropdown */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500 text-white">Assigned</Badge>
                  <Badge className="bg-amber-500 text-white">Service</Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select className="rounded-md border border-gray-300 p-2 text-sm">
                    <option value="all">All Drivers (3)</option>
                    <option value="1">Grady Green</option>
                    <option value="2">Jason Wells</option>
                    <option value="3">Kygo Jones</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Status Summary */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500 text-white">1</Badge>
                  <span className="text-sm">Assigned</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-amber-500 text-white">0</Badge>
                  <span className="text-sm">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500 text-white">0</Badge>
                  <span className="text-sm">Completed</span>
                </div>
              </div>
            </div>
            
            {/* Driver Columns */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Driver 1 - Grady Green */}
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Grady Green</h4>
                        <Badge className="bg-blue-500 text-white">1 assigned</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {getJobsByDriver(1).map(job => (
                      <DispatchJobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
                
                {/* Driver 2 - Jason Wells */}
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Jason Wells</h4>
                        <Badge variant="outline" className="border-gray-300 text-gray-600">0 assigned</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Drop jobs here to assign to Jason</p>
                    </div>
                  </div>
                </div>
                
                {/* Driver 3 - Kygo Jones */}
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Kygo Jones</h4>
                        <Badge variant="outline" className="border-gray-300 text-gray-600">0 assigned</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Drop jobs here to assign to Kygo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'map' && (
        <JobsMapPage />
      )}
    </div>
  );
};

export default JobsPage;
