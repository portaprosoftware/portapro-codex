import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Maximize2, X, Calendar } from 'lucide-react';
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
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface FullScreenDispatchViewProps {
  jobs: any[];
  drivers: any[];
  selectedDate: Date;
  onJobAssignment: (result: DropResult) => void;
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

  // Group jobs by driver and filter by time if needed
  const jobsByDriver = useMemo(() => {
    const grouped = new Map<string, any[]>();
    
    jobs.filter(job => job.driver_id).forEach(job => {
      // Filter jobs based on time filter
      if (timeFilter !== 'all' && job.scheduled_time) {
        const [hours] = job.scheduled_time.split(':').map(Number);
        if (timeFilter === 'morning' && hours >= 12) return;
        if (timeFilter === 'afternoon' && hours < 17) return;
      }
      
      const driverId = job.driver_id;
      if (!grouped.has(driverId)) {
        grouped.set(driverId, []);
      }
      grouped.get(driverId)!.push(job);
    });
    
    return grouped;
  }, [jobs, timeFilter]);

  // Handle both job and driver drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (result.destination?.droppableId === 'drivers-list') {
      // Handle driver reordering
      const items = Array.from(drivers);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setDrivers(items);
    } else {
      // Handle job assignment
      onJobAssignment(result);
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
                    
                    {/* Time Filter Buttons */}
                    {timelineView && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant={timeFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTimeFilter('all')}
                          className="text-xs"
                        >
                          All Day
                        </Button>
                        <Button
                          variant={timeFilter === 'morning' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTimeFilter('morning')}
                          className="text-xs"
                        >
                          Morning
                        </Button>
                        <Button
                          variant={timeFilter === 'afternoon' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTimeFilter('afternoon')}
                          className="text-xs"
                        >
                          Afternoon
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-sm font-mono text-muted-foreground">
                      {format(currentTime, 'h:mm:ss a')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
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

            {/* Main Content - Full Width Driver Swim Lanes */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {timelineView && (
                <TimelineGrid timeFilter={timeFilter} />
              )}
              
              <ScrollArea className="flex-1 relative">
                <Droppable droppableId="drivers-list" direction="vertical">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 p-4"
                    >
                      {drivers.map((driver, index) => (
                        <Draggable key={driver.id} draggableId={`driver-${driver.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "transition-all",
                                snapshot.isDragging && "opacity-95 rotate-1 scale-105 z-50 shadow-lg ring-2 ring-primary/20"
                              )}
                            >
                              <DriverSwimLane
                                driver={driver}
                                jobs={jobsByDriver.get(driver.id) || []}
                                onJobView={onJobView}
                                timelineView={timelineView}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                
                {/* Current time indicator spanning all drivers */}
                {timelineView && (() => {
                  const timelineStart = 6;
                  const timelineEnd = 20;
                  
                  const currentHour = currentTime.getHours();
                  const currentMinutes = currentTime.getMinutes();
                  
                  if (currentHour >= timelineStart && currentHour <= timelineEnd) {
                    const totalColumns = 11; // Before 8am + 8am-4pm (9 hours) + After 5pm
                    let position;
                    
                    if (currentHour < 8) {
                      // Before 8am column
                      const positionInColumn = ((currentHour - 6) + currentMinutes / 60) / 2; // 2 hours in before 8am
                      position = positionInColumn * (1 / totalColumns) * 100;
                    } else if (currentHour >= 17) {
                      // After 5pm column  
                      const lastColumnStart = 10 / totalColumns; // Start of last column
                      const positionInColumn = ((currentHour - 17) + currentMinutes / 60) / 3; // 3 hours in after 5pm
                      position = (lastColumnStart + positionInColumn * (1 / totalColumns)) * 100;
                    } else {
                      // Regular hourly columns (8am-4pm)
                      const columnIndex = currentHour - 7; // 8am = column 1, 9am = column 2, etc.
                      position = (columnIndex / totalColumns + (currentMinutes / 60) * (1 / totalColumns)) * 100;
                    }
                    
                    // Calculate position relative to the timeline area (after 192px driver column)
                    const leftOffset = 192; // 48 * 4 (w-48 = 192px)
                    const timelineWidth = `calc(100% - ${leftOffset}px)`;
                    
                    return (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                        style={{ 
                          left: `calc(${leftOffset}px + (${timelineWidth} * ${position / 100}))`,
                        }}
                      >
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </ScrollArea>
            </div>
          </div>
        </DragDropContext>
      </DrawerContent>
    </Drawer>
  );
};