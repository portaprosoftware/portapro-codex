import React, { useState, useMemo } from 'react';
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
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface FullScreenDispatchViewProps {
  jobs: any[];
  drivers: any[];
  selectedDate: Date;
  onJobAssignment: (result: DropResult) => void;
  onJobView: (jobId: string) => void;
}

export const FullScreenDispatchView: React.FC<FullScreenDispatchViewProps> = ({
  jobs,
  drivers,
  selectedDate,
  onJobAssignment,
  onJobView
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timelineView, setTimelineView] = useState(true);

  // Group jobs by driver
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
        <DragDropContext onDragEnd={onJobAssignment}>
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
                <TimelineGrid />
              )}
              
              <ScrollArea className="flex-1 relative">
                <div className="space-y-2 p-4">
                  {drivers.map(driver => (
                    <DriverSwimLane
                      key={driver.id}
                      driver={driver}
                      jobs={jobsByDriver.get(driver.id) || []}
                      onJobView={onJobView}
                      timelineView={timelineView}
                    />
                  ))}
                </div>
                
                {/* Current time indicator spanning all drivers */}
                {timelineView && (() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinutes = now.getMinutes();
                  const timelineStart = 6;
                  const timelineEnd = 20;
                  
                  if (currentHour >= timelineStart && currentHour <= timelineEnd) {
                    const hoursFromStart = currentHour - timelineStart;
                    const minutesAsHours = currentMinutes / 60;
                    const totalHoursFromStart = hoursFromStart + minutesAsHours;
                    const timelineHours = timelineEnd - timelineStart;
                    const position = (totalHoursFromStart / timelineHours) * 100;
                    
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