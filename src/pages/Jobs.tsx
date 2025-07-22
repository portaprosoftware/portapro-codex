import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ClipboardList, ChevronLeft, ChevronRight, Search, X, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Sample data for demonstration
const drivers = [
  { id: 1, name: 'Grady Green', assignedJobs: 1 },
  { id: 2, name: 'Jason Wells', assignedJobs: 0 },
  { id: 3, name: 'Kygo Jones', assignedJobs: 0 }
];

const jobs = [
  {
    id: 'SVC-051',
    customerId: 123,
    customerName: 'Cuyahoga Waste Services',
    jobType: 'Service',
    status: 'assigned',
    driverId: 1,
  }
];

const JobsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'calendar' | 'dispatch' | 'map'>('dispatch');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Format the current date
  const dateFormatter = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  const formattedDate = dateFormatter.format(currentDate);
  
  // Format the date for the button display
  const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const buttonDate = monthDayFormatter.format(currentDate);

  // Handle previous and next day navigation
  const goToPreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setCurrentDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
  };

  // Set the active tab based on route
  React.useEffect(() => {
    if (location.pathname.includes('/calendar')) {
      setActiveTab('calendar');
    } else if (location.pathname.includes('/map')) {
      setActiveTab('map');
    } else {
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
            <Calendar className="w-4 h-4 mr-2" />
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

      <div className="grid grid-cols-12 gap-6">
        {/* Left panel - Unassigned jobs */}
        <div className="col-span-3 bg-white rounded-2xl shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-orange-500 mr-2 w-5 h-5" />
              <h2 className="font-semibold text-lg">Unassigned Jobs</h2>
            </div>
            <Badge variant="outline" className="bg-orange-500 text-white">0</Badge>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="default" size="sm" className="rounded-full text-xs">
              All (0)
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full text-xs">
              Service
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full text-xs">
              Pickup
            </Button>
          </div>
          
          <div className="h-60 flex flex-col items-center justify-center text-muted-foreground">
            <div className="rounded-full bg-gray-100 p-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-gray-400" />
            </div>
            <p>No unassigned jobs</p>
          </div>
        </div>
        
        {/* Main panel - Dispatch board */}
        <div className="col-span-9 bg-white rounded-2xl shadow-md">
          <div className="p-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <X className="w-5 h-5 mr-3 text-gray-400" />
                  <h2 className="font-semibold text-lg">Dispatch Board</h2>
                </div>
                <p className="text-muted-foreground text-sm">Manage driver schedules and job assignments</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={goToPreviousDay}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button variant="outline" className="px-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  {buttonDate}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={goToNextDay}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="default"
                  className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  + Schedule
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search by customer, job type, or driver..." 
                  className="pl-10 rounded-md py-2"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="rounded-full bg-blue-50 text-blue-600 border-blue-200">
                  Assigned
                </Button>
                <Button variant="outline" size="sm" className="rounded-full bg-blue-50 text-blue-600 border-blue-200">
                  Service
                </Button>
              </div>
              
              <div className="flex items-center">
                <Button variant="outline" size="sm" className="text-sm flex items-center">
                  All Drivers (3)
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">1 job</p>
              <div className="flex space-x-2 mt-1">
                <Badge className="bg-blue-500 hover:bg-blue-600">1 Assigned</Badge>
                <Badge className="bg-orange-500 hover:bg-orange-600">0 In Progress</Badge>
                <Badge className="bg-green-500 hover:bg-green-600">0 Completed</Badge>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                <div>
                  <h3 className="font-medium">{formattedDate}</h3>
                  <p className="text-sm text-gray-500">1 job scheduled</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {drivers.map(driver => (
                <div key={driver.id} className="space-y-4">
                  {/* Driver card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-100 rounded-full p-2 mr-3">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{driver.name}</span>
                      </div>
                      
                      {driver.assignedJobs > 0 && (
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          {driver.assignedJobs} assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Drop zone */}
                  <div className={cn(
                    "border-2 border-dashed border-gray-200 rounded-xl p-4 min-h-[200px]",
                    "flex flex-col items-center justify-center text-center"
                  )}>
                    {jobs.filter(job => job.driverId === driver.id).length > 0 ? (
                      // Job cards
                      jobs.filter(job => job.driverId === driver.id).map(job => (
                        <div 
                          key={job.id} 
                          className="w-full bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg p-3 shadow-md"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{job.id}</span>
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
                              {job.status}
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <p className="font-medium text-sm">{job.customerName}</p>
                            <p className="text-xs text-gray-300">{job.jobType}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <Button variant="outline" size="sm" className="bg-transparent border-white text-white hover:bg-white/10">
                              Start
                            </Button>
                            <Button variant="outline" size="sm" className="bg-transparent border-white text-white hover:bg-white/10">
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Empty state
                      <>
                        <div className="rounded-full bg-gray-100 p-3 mb-2">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Drop jobs here</p>
                        <p className="text-xs text-gray-400">to assign to {driver.name}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;

// Just importing here for the component to compile
const ChevronDown: React.FC<{ className?: string }> = ({ className }) => {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
};