import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, ClipboardList, ChevronLeft, ChevronRight, Search, X, Eye, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui/select';

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
    driverName: 'Grady Green'
  },
  {
    id: 'SVC-941',
    customerId: 124,
    customerName: 'BlueWave Festival',
    jobType: 'Service',
    status: 'assigned',
    driverId: 2,
    scheduledDate: new Date(2025, 6, 17), // July 17, 2025
    driverName: 'Jason Wells'
  },
  {
    id: 'PKP-122',
    customerId: 125,
    customerName: 'Mountain View Resort',
    jobType: 'Pickup',
    status: 'in_progress',
    driverId: 1,
    scheduledDate: new Date(2025, 6, 18), // July 18, 2025
    driverName: 'Grady Green'
  },
  {
    id: 'SVC-144',
    customerId: 126,
    customerName: 'Sunset Park',
    jobType: 'Service',
    status: 'completed',
    driverId: 3,
    scheduledDate: new Date(2025, 6, 19), // July 19, 2025
    driverName: 'Kygo Jones'
  }
];

// Map status to colors
const statusColors = {
  assigned: 'bg-blue-500',
  in_progress: 'bg-orange-500',
  completed: 'bg-green-500'
};

const statusText = {
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed'
};

// Function to get jobs for a specific date
const getJobsForDate = (date: Date) => {
  return mockJobs.filter(job => 
    isSameDay(new Date(job.scheduledDate), date)
  );
};

// Function to get unique job statuses for a date
const getStatusesForDate = (date: Date) => {
  const jobs = getJobsForDate(date);
  return [...new Set(jobs.map(job => job.status))];
};

const JobsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'calendar' | 'dispatch' | 'map'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6, 1)); // July 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<typeof mockJobs>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Filters
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

  // Handle date selection
  useEffect(() => {
    if (selectedDate) {
      const jobs = getJobsForDate(selectedDate);
      setSelectedJobs(jobs);
      setIsPanelOpen(true);
    } else {
      setSelectedJobs([]);
      setIsPanelOpen(false);
    }
  }, [selectedDate]);

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

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get days for the current month
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Close the panel
  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedDate(null);
  };

  // Calendar day renderer
  const renderDay = (day: Date) => {
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isToday = isSameDay(day, new Date());
    const dayJobs = getJobsForDate(day);
    const statuses = getStatusesForDate(day);
    const isSelected = selectedDate && isSameDay(day, selectedDate);

    return (
      <div 
        key={day.toString()}
        className={cn(
          "h-24 p-1 border border-gray-200 relative cursor-pointer hover:bg-gray-50 transition-colors",
          !isCurrentMonth && "bg-gray-50 text-gray-400",
          isToday && "border-blue-500",
          isSelected && "ring-2 ring-blue-500"
        )}
        onClick={() => setSelectedDate(day)}
      >
        <div className="text-right p-1">
          <span className={cn(
            "text-sm font-medium",
            isToday && "text-blue-500"
          )}>
            {format(day, 'd')}
          </span>
        </div>
        
        {/* Status badges */}
        {dayJobs.length > 0 && (
          <div className="absolute top-1 left-1 flex flex-col gap-1">
            {statuses.length <= 3 ? (
              // Show individual status badges if there are 3 or fewer
              statuses.map(status => (
                <div 
                  key={status}
                  className={cn(
                    "w-3 h-3 rounded-full",
                    statusColors[status as keyof typeof statusColors]
                  )}
                />
              ))
            ) : (
              // Show job count if there are more than 3 statuses
              <Badge className="bg-blue-500 text-white text-xs">
                {dayJobs.length}
              </Badge>
            )}
          </div>
        )}
        
        {/* Job preview (limited space) */}
        {dayJobs.length > 0 && (
          <div className="mt-1 text-xs">
            {dayJobs.slice(0, 2).map(job => (
              <div key={job.id} className="truncate">
                {job.jobType}
              </div>
            ))}
            {dayJobs.length > 2 && <div>+{dayJobs.length - 2} more</div>}
          </div>
        )}
      </div>
    );
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
        <div className={cn("bg-white rounded-2xl shadow-md p-6", isPanelOpen && "flex")}>
          <div className={cn("w-full", isPanelOpen && "w-2/3 pr-6")}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Calendar View</h2>
                <p className="text-muted-foreground">Schedule and manage job assignments</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button variant="outline" className="px-4">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(currentMonth, 'MMMM yyyy')}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={goToNextMonth}
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
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search by customer name or job ID..." 
                  className="pl-10 rounded-md py-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Filters
                </Button>
              </div>
            </div>
            
            <div className="mb-6 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Driver</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  <option value="all">All Drivers</option>
                  <option value="1">Grady Green</option>
                  <option value="2">Jason Wells</option>
                  <option value="3">Kygo Jones</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="delivery">Delivery</option>
                  <option value="service">Service</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="all">All Products</option>
                  <option value="porta-potty">Porta Potty</option>
                  <option value="handwash">Handwash Station</option>
                  <option value="shower">Shower Trailer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Variation</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={selectedVariation}
                  onChange={(e) => setSelectedVariation(e.target.value)}
                >
                  <option value="all">All Variations</option>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="ada">ADA Compliant</option>
                </select>
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="mb-4 flex space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Assigned</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm">In Progress</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Completed</span>
              </div>
            </div>
            
            {/* Calendar grid */}
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Fill in empty cells for days of the week before the first of the month */}
                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-start-${i}`} className="h-24 p-1 bg-gray-50 border border-gray-200"></div>
                ))}
                
                {/* Render the days of the month */}
                {days.map(day => renderDay(day))}
                
                {/* Fill in empty cells for days of the week after the last of the month */}
                {Array.from({ length: 6 - new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDay() }).map((_, i) => (
                  <div key={`empty-end-${i}`} className="h-24 p-1 bg-gray-50 border border-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Slide-in panel for selected day */}
          {isPanelOpen && selectedDate && (
            <div className="w-1/3 border-l border-gray-200 pl-6 h-full animate-slide-in-right">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Jobs for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClosePanel}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-muted-foreground mb-4">
                {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} scheduled
              </p>
              
              <div className="flex justify-end mb-4">
                <Button
                  variant="default"
                  className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  + Schedule
                </Button>
              </div>
              
              {selectedJobs.length > 0 ? (
                <div className="space-y-4">
                  {selectedJobs.map(job => (
                    <div 
                      key={job.id}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{job.id}</span>
                        <Badge 
                          className={cn(
                            statusColors[job.status as keyof typeof statusColors],
                            "text-white"
                          )}
                        >
                          {statusText[job.status as keyof typeof statusText]}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <p className="font-medium">{job.customerName}</p>
                        <p className="text-sm text-gray-500">{job.jobType}</p>
                      </div>
                      
                      <div className="text-sm mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Driver:</span>
                          <span>{job.driverName}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        
                        {job.status !== 'completed' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-lg font-medium text-gray-500">No jobs scheduled</p>
                  <p className="text-gray-400">No pickups or returns scheduled for this date</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobsPage;