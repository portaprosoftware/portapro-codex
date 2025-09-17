import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Clock, Maximize2, X, Calendar, Users, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { ModernDigitalClock } from '@/components/ui/ModernDigitalClock';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerTrigger
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimelineGrid, TIME_SLOTS } from './TimelineGrid';
import { DriverSwimLane } from './DriverSwimLane';
import { UnassignedJobsSection } from './UnassignedJobsSection';
import { DriverOrderModal } from './DriverOrderModal';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FullScreenDispatchViewProps {
  jobs: any[];
  drivers: any[];
  selectedDate: Date;
  onJobAssignment: (jobId: string, driverId: string | null, timeSlotId?: string | null) => void;
  onJobView: (jobId: string) => void;
}

export const FullScreenDispatchView: React.FC<FullScreenDispatchViewProps> = ({
  jobs,
  drivers: driversData,
  selectedDate,
  onJobAssignment,
  onJobView
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timelineView, setTimelineView] = useState(true);
  const [drivers, setDrivers] = useState(driversData);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [isDriverOrderModalOpen, setIsDriverOrderModalOpen] = useState(false);
  const { toast } = useToast();
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const verticalScrollRef = useRef<HTMLDivElement>(null);
  const stickyColumnRef = useRef<HTMLDivElement>(null);

  // Update drivers when prop changes
  useEffect(() => {
    setDrivers(driversData);
  }, [driversData]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Group jobs by driver (no time filtering needed with new design)
  const jobsByDriver = useMemo(() => {
    const grouped = new Map<string, any[]>();
    
    jobs.filter(job => job.driver_id).forEach(job => {
      const driverId = job.driver_id;
      if (!grouped.has(driverId)) {
        grouped.set(driverId, []);
      }
      grouped.get(driverId)!.push(job);
    });
    
    return grouped;
  }, [jobs]);

  // Get unassigned jobs
  const unassignedJobs = useMemo(() => {
    return jobs.filter(job => !job.driver_id);
  }, [jobs]);

  // Handle job assignment with time slot logic
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    // Extract time slot information from destination droppableId
    const destinationId = result.destination.droppableId;
    
    if (destinationId.includes('-')) {
      // Timeline view: droppableId format is "driverId-timeSlotId" or "unassigned-timeSlotId"
      const [driverId, timeSlotId] = destinationId.split('-');
      const jobId = result.draggableId;
      
      console.log('Timeline drop:', { jobId, driverId, timeSlotId });
      
      // Show informational toast for no-time drops
      if (timeSlotId === 'no-time') {
        toast({
          title: "Job moved to unscheduled",
          description: "To remove the time completely, click 'View Job' and turn off the time toggle.",
          duration: 4000,
        });
      }
      
      // Call parent with driver assignment and time slot info
      onJobAssignment(jobId, driverId === 'unassigned' ? null : driverId, timeSlotId);
    } else {
      // Regular driver assignment (no time slot)
      const driverId = destinationId === 'unassigned' ? null : destinationId;
      const jobId = result.draggableId;
      
      console.log('Regular drop:', { jobId, driverId });
      
      onJobAssignment(jobId, driverId, null);
    }
  };

  // Handle driver order update
  const handleDriverOrderUpdate = (orderedDrivers: any[]) => {
    setDrivers(orderedDrivers);
  };

  // Sync vertical scrolling between sticky column and main content
  const syncVerticalScroll = (source: 'sticky' | 'main') => {
    if (!stickyColumnRef.current || !verticalScrollRef.current) return;
    
    if (source === 'sticky') {
      verticalScrollRef.current.scrollTop = stickyColumnRef.current.scrollTop;
    } else {
      stickyColumnRef.current.scrollTop = verticalScrollRef.current.scrollTop;
    }
  };

  // Scroll functions
  const scrollHorizontal = (direction: 'left' | 'right') => {
    if (horizontalScrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = horizontalScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      horizontalScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const scrollVertical = (direction: 'up' | 'down') => {
    if (verticalScrollRef.current && stickyColumnRef.current) {
      const scrollAmount = 200;
      const newScrollTop = verticalScrollRef.current.scrollTop + (direction === 'down' ? scrollAmount : -scrollAmount);
      verticalScrollRef.current.scrollTo({ top: newScrollTop, behavior: 'smooth' });
      stickyColumnRef.current.scrollTo({ top: newScrollTop, behavior: 'smooth' });
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Maximize2 className="h-4 w-4" />
          Full Screen Dispatch
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="h-[100vh] max-h-[100vh]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <DrawerHeader className="flex-shrink-0 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <DrawerTitle className="text-2xl font-semibold">
                    Dispatch Center
                  </DrawerTitle>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(selectedDate, 'MMM d, yyyy')}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    {jobs.length} Jobs ({unassignedJobs.length} unassigned)
                  </Badge>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="timeline-view"
                        checked={timelineView}
                        onCheckedChange={setTimelineView}
                      />
                      <Label htmlFor="timeline-view" className="flex items-center gap-2 cursor-pointer text-sm">
                        <Clock className="h-4 w-4" />
                        Timeline View
                      </Label>
                    </div>
                    
                    <ModernDigitalClock showSeconds={true} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Scroll Controls - only show in timeline view */}
                  {timelineView && (
                    <div className="flex items-center gap-1 mr-2">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => scrollHorizontal('left')}
                          title="Scroll left"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => scrollHorizontal('right')}
                          title="Scroll right"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-1 ml-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => scrollVertical('up')}
                          title="Scroll up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => scrollVertical('down')}
                          title="Scroll down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/jobs?dispatch=fullscreen', '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDriverOrderModalOpen(true)}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Reorder Drivers
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DrawerHeader>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
              {timelineView ? (
                <div className="h-full flex flex-col">
                  {/* Completely Sticky Blue Header Row - Never moves */}
                  <div className="flex-shrink-0 flex sticky top-0 z-30 bg-background">
                    {/* Unassigned Header Section */}
                    <div className="w-32 h-[160px] border-b border-r bg-card flex items-center justify-center">
                      <div className="text-xs font-medium text-center">
                        <div className="mb-1">Unassigned</div>
                        <Badge variant="secondary" className="text-xs">
                          {unassignedJobs.length} jobs
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Unassigned Timeline Content - Scrolls horizontally */}
                    <div className="flex-1 h-[160px] border-b overflow-x-auto" 
                         ref={horizontalScrollRef}
                         onScroll={(e) => {
                           // Sync horizontal scroll with main content
                           const mainContent = document.querySelector('[data-timeline-content]') as HTMLElement;
                           if (mainContent) {
                             mainContent.scrollLeft = e.currentTarget.scrollLeft;
                           }
                         }}>
                      <UnassignedJobsSection
                        jobs={unassignedJobs}
                        onJobView={onJobView}
                        timelineView={timelineView}
                      />
                    </div>
                  </div>
                  
                  {/* Blue Drivers Header Row - Sticky under the Unassigned row */}
                  <div className="flex-shrink-0 flex sticky top-[160px] z-20 bg-gradient-to-r from-blue-600 to-blue-700">
                    {/* Drivers Label */}
                    <div className="w-32 h-[40px] border-r border-blue-500/30 text-white flex items-center justify-center">
                      <div className="text-xs font-medium">Drivers</div>
                    </div>
                    
                    {/* Time Slot Headers - Scrolls horizontally */}
                    <div className="flex-1 h-[40px] overflow-x-auto"
                         onScroll={(e) => {
                           // Sync with other horizontal scroll areas
                           if (horizontalScrollRef.current) {
                             horizontalScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                           }
                           const mainContent = document.querySelector('[data-timeline-content]') as HTMLElement;
                           if (mainContent) {
                             mainContent.scrollLeft = e.currentTarget.scrollLeft;
                           }
                         }}>
                      <div className="flex min-w-max">
                        {TIME_SLOTS.map((slot) => (
                          <div
                            key={slot.id}
                            className={cn(
                              "border-r border-blue-500/30 text-center py-3 px-2 text-xs font-medium text-white flex items-center justify-center",
                              slot.id === 'no-time' ? "bg-blue-700" : "bg-gradient-to-r from-blue-600 to-blue-700"
                            )}
                            style={{ width: slot.width, minWidth: slot.width, flexShrink: 0 }}
                          >
                            {slot.id === 'no-time' ? 'No Time Selected' : slot.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Scrollable Content Area */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Sticky Driver Names Column */}
                    <div className="w-32 flex-shrink-0 bg-background border-r overflow-y-auto"
                         ref={stickyColumnRef}
                         onScroll={() => syncVerticalScroll('sticky')}>
                      {drivers.map((driver) => (
                        <div key={driver.id} className="h-[160px] border-b p-2 flex items-center bg-card">
                          <div className="flex flex-col gap-1 w-full">
                            <div className="font-medium text-xs text-center">
                              {driver.first_name} {driver.last_name}
                            </div>
                            <Badge variant={jobsByDriver.get(driver.id)?.length > 3 ? 'destructive' : jobsByDriver.get(driver.id)?.length > 1 ? 'default' : 'secondary'} className="text-xs self-center">
                              {jobsByDriver.get(driver.id)?.length || 0} jobs
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Driver Timeline Content - Scrolls both ways */}
                    <div className="flex-1 overflow-auto relative"
                         ref={verticalScrollRef}
                         data-timeline-content
                         onScroll={(e) => {
                           syncVerticalScroll('main');
                           // Sync horizontal scroll with headers
                           if (horizontalScrollRef.current) {
                             horizontalScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                           }
                           const headerScroll = document.querySelector('[data-timeline-content]')?.previousElementSibling?.lastElementChild as HTMLElement;
                           if (headerScroll) {
                             headerScroll.scrollLeft = e.currentTarget.scrollLeft;
                           }
                         }}>
                      <div className="min-w-max">
                        {drivers.map((driver) => (
                          <DriverSwimLane
                            key={driver.id}
                            driver={driver}
                            jobs={jobsByDriver.get(driver.id) || []}
                            onJobView={onJobView}
                            timelineView={timelineView}
                            hideDriverInfo={true}
                          />
                        ))}
                      </div>
                      
                      {/* Current time indicator */}
                      {(() => {
                        const currentHour = currentTime.getHours();
                        const currentMinutes = currentTime.getMinutes();
                        
                        if (currentHour >= 6 && currentHour < 20) {
                          const timeInMinutes = currentHour * 60 + currentMinutes;
                          const timelineStart = 6 * 60;
                          const timelineEnd = 20 * 60;
                          const timelineRange = timelineEnd - timelineStart;
                          const positionPercent = (timeInMinutes - timelineStart) / timelineRange;
                          
                          const noTimeSlotWidth = 800;
                          const timeSlotWidth = 200;
                          const slotsBeforeCurrentTime = Math.floor(positionPercent * 14);
                          const positionWithinSlot = (positionPercent * 14) - slotsBeforeCurrentTime;
                          
                          // Position relative to the scrollable content area
                          const leftPosition = noTimeSlotWidth + (slotsBeforeCurrentTime * timeSlotWidth) + (positionWithinSlot * timeSlotWidth);
                          
                          return (
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                              style={{ left: `${leftPosition}px` }}
                            >
                              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Unassigned Jobs in Grid View */}
                    <UnassignedJobsSection
                      jobs={unassignedJobs}
                      onJobView={onJobView}
                      timelineView={timelineView}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {drivers.map((driver) => (
                        <DriverSwimLane
                          key={driver.id}
                          driver={driver}
                          jobs={jobsByDriver.get(driver.id) || []}
                          onJobView={onJobView}
                          timelineView={timelineView}
                        />
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DragDropContext>
      </DrawerContent>

      {/* Driver Order Modal */}
      <DriverOrderModal
        isOpen={isDriverOrderModalOpen}
        onClose={() => setIsDriverOrderModalOpen(false)}
        drivers={drivers}
        onSaveOrder={handleDriverOrderUpdate}
      />
    </Drawer>
  );
};