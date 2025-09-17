import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Maximize2, X, Calendar, Users } from 'lucide-react';
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
import { TimelineGrid } from './TimelineGrid';
import { DriverSwimLane } from './DriverSwimLane';
import { DriverOrderModal } from './DriverOrderModal';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

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

  // Handle job assignment with time slot logic
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    // Extract time slot information from destination droppableId
    const destinationId = result.destination.droppableId;
    
    if (destinationId.includes('-')) {
      // Timeline view: droppableId format is "driverId-timeSlotId"
      const [driverId, timeSlotId] = destinationId.split('-');
      const jobId = result.draggableId;
      
      console.log('Timeline drop:', { jobId, driverId, timeSlotId });
      
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
                    {jobs.length} Jobs
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
                    
                    <div className="text-sm font-mono text-muted-foreground">
                      {format(currentTime, 'h:mm:ss a')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
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

            {/* Main Content - Unified Timeline */}
            <div className="flex-1 overflow-hidden relative">
              {timelineView ? (
                <div className="h-full overflow-x-auto overflow-y-auto">
                  <div className="min-w-max">
                    <TimelineGrid />
                    <div className="space-y-2">
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
                      
                      const driverColumnWidth = 128;
                      const noTimeSlotWidth = 200;
                      const timeSlotWidth = 200;
                      const slotsBeforeCurrentTime = Math.floor(positionPercent * 14);
                      const positionWithinSlot = (positionPercent * 14) - slotsBeforeCurrentTime;
                      
                      const leftPosition = driverColumnWidth + noTimeSlotWidth + (slotsBeforeCurrentTime * timeSlotWidth) + (positionWithinSlot * timeSlotWidth);
                      
                      return (
                        <div 
                          className="absolute top-[60px] bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                          style={{ left: `${leftPosition}px` }}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
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