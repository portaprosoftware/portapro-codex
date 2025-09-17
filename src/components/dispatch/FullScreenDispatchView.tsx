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
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
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
      
      <DrawerContent className="h-[100vh] max-h-[100vh]">
        <DragDropContext onDragEnd={onJobAssignment}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <DrawerHeader className="flex-shrink-0 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <DrawerTitle className="text-2xl font-semibold">
                    Dispatch Control Center
                  </DrawerTitle>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(selectedDate, 'MMM d, yyyy')}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    {jobs.length} Jobs
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="timeline-view"
                      checked={timelineView}
                      onCheckedChange={setTimelineView}
                    />
                    <Label htmlFor="timeline-view" className="flex items-center gap-2 cursor-pointer">
                      <Clock className="h-4 w-4" />
                      Timeline View
                    </Label>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </DrawerClose>
                </div>
              </div>
            </DrawerHeader>

            {/* Main Content - Full Width Driver Swim Lanes */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {timelineView && (
                <TimelineGrid />
              )}
              
              <ScrollArea className="flex-1">
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
              </ScrollArea>
            </div>
          </div>
        </DragDropContext>
      </DrawerContent>
    </Drawer>
  );
};