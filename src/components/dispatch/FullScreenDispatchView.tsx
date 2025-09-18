import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Clock, Maximize2, X, Calendar, Users, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ExternalLink, Info } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    console.log('Drag ended:', {
      source: result.source,
      destination: result.destination,
      draggableId: result.draggableId
    });

    if (!result.destination) {
      console.log('No destination - drop cancelled');
      return;
    }

    // Extract time slot information from destination droppableId
    const destinationId = result.destination.droppableId;
    const sourceId = result.source.droppableId;
    
    // Don't do anything if dropped in the same position
    if (sourceId === destinationId && result.source.index === result.destination.index) {
      console.log('Dropped in same position - no action needed');
      return;
    }
    
    if (destinationId.includes('-')) {
      // Timeline view: droppableId format is "driverId-timeSlotId" or "unassigned-timeSlotId"
      const [driverId, timeSlotId] = destinationId.split('-');
      const jobId = result.draggableId;
      
      console.log('Timeline drop:', { jobId, driverId, timeSlotId, fromSource: sourceId });
      
      // Show informational toast for no-time drops
      if (timeSlotId === 'no-time') {
        toast({
          title: "Job moved to unscheduled",
          description: "To remove the time completely, click 'View Job' and turn off the time toggle.",
          duration: 4000,
        });
      }
      
      // Show success toast for cross-driver moves
      if (sourceId !== destinationId && !sourceId.startsWith('unassigned')) {
        const [sourceDriverId] = sourceId.split('-');
        if (sourceDriverId !== driverId) {
          toast({
            title: "Job reassigned",
            description: `Job moved to ${driverId === 'unassigned' ? 'unassigned' : 'different driver'}`,
            duration: 3000,
          });
        }
      }
      
      // Call parent with driver assignment and time slot info
      onJobAssignment(jobId, driverId === 'unassigned' ? null : driverId, timeSlotId);
    } else {
      // Regular driver assignment (no time slot)
      const driverId = destinationId === 'unassigned' ? null : destinationId;
      const jobId = result.draggableId;
      
      console.log('Regular drop:', { jobId, driverId, fromSource: sourceId });
      
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
    if (verticalScrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = verticalScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      verticalScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const scrollVertical = (direction: 'up' | 'down') => {
    if (verticalScrollRef.current && stickyColumnRef.current) {
      const scrollAmount = 300;
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
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(selectedDate, 'MMM d, yyyy')}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Change Date Instructions</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            To change the date: Close full screen dispatch center, edit date and reopen "Full Screen Dispatch"
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                    Reorder List
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
                <div className="h-full flex">
                  {/* Left Sticky Column */}
                  <div className="w-32 flex-shrink-0 bg-background border-r flex flex-col">
                    <div className="sticky top-0 z-30 bg-background">
                      {/* Unassigned Header (left cell) */}
                      <div className="h-[128px] border-b bg-card flex items-center justify-center">
                        <div className="text-xs font-medium text-center">
                          <div className="mb-1">Unassigned</div>
                          <Badge variant="secondary" className="text-xs">
                            {unassignedJobs.length} jobs
                          </Badge>
                        </div>
                      </div>
                      {/* Drivers label (left cell of blue row) */}
                      <div className="h-[40px] border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center">
                        <div className="text-xs font-medium">Drivers</div>
                      </div>
                    </div>

                    {/* Driver Names (scroll vertically) */}
                    <div
                      ref={stickyColumnRef}
                      className="flex-1 overflow-y-auto"
                      onScroll={() => syncVerticalScroll('sticky')}
                    >
                      {drivers.map((driver) => (
                        <div key={driver.id} className="h-[128px] border-b p-2 flex items-center bg-card">
                          <div className="flex flex-col gap-1 w-full">
                            <div className="font-medium text-xs text-center">
                              {driver.first_name} {driver.last_name}
                            </div>
                            <Badge
                              variant={jobsByDriver.get(driver.id)?.length > 3 ? 'destructive' : jobsByDriver.get(driver.id)?.length > 1 ? 'default' : 'secondary'}
                              className="text-xs self-center"
                            >
                              {jobsByDriver.get(driver.id)?.length || 0} jobs
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right side: single scroll container for both directions */}
                  <div className="flex-1 overflow-hidden">
                    <div
                      ref={verticalScrollRef}
                      className="h-full overflow-auto relative [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:block [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 [&::-webkit-scrollbar-corner]:bg-gray-100"
                      style={{ 
                        scrollbarWidth: 'thin', 
                        scrollbarColor: '#d1d5db #f3f4f6',
                        scrollbarGutter: 'stable'
                      }}
                      data-timeline-content
                      onScroll={() => syncVerticalScroll('main')}
                    >
                      <div className="min-w-max">
                        {/* Sticky top: Unassigned timeline row + blue time headers row */}
                        <div className="sticky top-0 z-20 bg-background">
                          {/* Unassigned timeline (scrolls horizontally with content) */}
                          <div className="h-[128px] border-b">
                            <UnassignedJobsSection
                              jobs={unassignedJobs}
                              onJobView={onJobView}
                              timelineView={timelineView}
                            />
                          </div>
                          {/* Time slot headers (scroll horizontally with content) */}
                          <div className="h-[40px] border-b bg-gradient-to-r from-blue-600 to-blue-700 flex">
                            {TIME_SLOTS.map((slot) => (
                              <div
                                key={slot.id}
                                className={cn(
                                  'border-r border-blue-500/30 text-center py-3 px-2 text-xs font-medium text-white flex items-center justify-center',
                                  slot.id === 'no-time' ? 'bg-blue-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'
                                )}
                                style={{ width: slot.width, minWidth: slot.width, flexShrink: 0 }}
                              >
                                {slot.id === 'no-time' ? 'No Time Selected' : slot.label}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Driver swim lanes */}
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

                      {/* Current time indicator aligned with grid */}
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
                          const positionWithinSlot = positionPercent * 14 - slotsBeforeCurrentTime;
                          const leftPosition = noTimeSlotWidth + slotsBeforeCurrentTime * timeSlotWidth + positionWithinSlot * timeSlotWidth;
                          
                           // Calculate full height: unassigned (128px) + blue header (40px) + all driver rows (128px each)
                           const unassignedHeight = 128;
                           const headerHeight = 40;
                           const driverRowHeight = 128;
                          const totalHeight = unassignedHeight + headerHeight + (drivers.length * driverRowHeight);
                          
                          return (
                            <div
                              className="absolute w-0.5 bg-red-500 z-20 pointer-events-none"
                              style={{ 
                                left: `${leftPosition}px`,
                                top: 0,
                                height: `${totalHeight}px`
                              }}
                            >
                              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
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