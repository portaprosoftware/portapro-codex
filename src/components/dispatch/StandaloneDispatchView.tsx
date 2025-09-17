import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { Clock, Calendar, Users, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineGrid } from './TimelineGrid';
import { DriverSwimLane } from './DriverSwimLane';
import { UnassignedJobsSection } from './UnassignedJobsSection';
import { DriverOrderModal } from './DriverOrderModal';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StandaloneDispatchViewProps {
  jobs: any[];
  drivers: any[];
  selectedDate: Date;
  onJobAssignment: (jobId: string, driverId: string | null, timeSlotId?: string | null) => void;
  onJobView: (jobId: string) => void;
  onDateChange: (date: Date) => void;
}

export const StandaloneDispatchView: React.FC<StandaloneDispatchViewProps> = ({
  jobs,
  drivers: driversData,
  selectedDate,
  onJobAssignment,
  onJobView,
  onDateChange
}) => {
  const [timelineView, setTimelineView] = useState(true);
  const [drivers, setDrivers] = useState(driversData);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [isDriverOrderModalOpen, setIsDriverOrderModalOpen] = useState(false);
  const { toast } = useToast();
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const verticalScrollRef = useRef<HTMLDivElement>(null);

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

  // Group jobs by driver
  const jobsByDriver = useMemo(() => {
    const grouped = jobs.reduce((acc, job) => {
      const driverId = job.driver_id || 'unassigned';
      if (!acc[driverId]) {
        acc[driverId] = [];
      }
      acc[driverId].push(job);
      return acc;
    }, {} as Record<string, any[]>);
    return grouped;
  }, [jobs]);

  // Get unassigned jobs
  const unassignedJobs = useMemo(() => {
    return jobs.filter(job => !job.driver_id);
  }, [jobs]);

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const jobId = draggableId;
    let newDriverId: string | null = null;
    let timeSlotId: string | null = null;

    // Handle timeline view drops
    if (timelineView && destination.droppableId.includes('timeline-')) {
      const parts = destination.droppableId.split('timeline-');
      if (parts[1] === 'unassigned') {
        newDriverId = null;
        const timeSlotParts = parts[1].split('-');
        if (timeSlotParts.length > 1) {
          timeSlotId = timeSlotParts.slice(1).join('-');
        }
      } else {
        const [driverPart, ...timeSlotParts] = parts[1].split('-');
        newDriverId = driverPart === 'unassigned' ? null : driverPart;
        if (timeSlotParts.length > 0) {
          timeSlotId = timeSlotParts.join('-');
        }
      }
    } else {
      // Regular driver assignment
      newDriverId = destination.droppableId === 'unassigned' ? null : destination.droppableId;
    }

    onJobAssignment(jobId, newDriverId, timeSlotId);
  };

  // Handle driver order update
  const handleDriverOrderUpdate = (newDriverOrder: any[]) => {
    setDrivers(newDriverOrder);
  };

  // Scroll controls
  const scrollHorizontal = (direction: 'left' | 'right') => {
    if (horizontalScrollRef.current) {
      const scrollAmount = 300;
      horizontalScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollVertical = (direction: 'up' | 'down') => {
    if (verticalScrollRef.current) {
      const scrollAmount = 200;
      verticalScrollRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const totalJobs = jobs.length;
  const assignedJobs = jobs.filter(job => job.driver_id).length;
  const unassignedJobsCount = totalJobs - assignedJobs;

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subDays(selectedDate, 1) 
      : addDays(selectedDate, 1);
    onDateChange(newDate);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Dispatch Monitor</h1>
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                {format(selectedDate, 'EEEE, MMM d, yyyy')}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats and Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {drivers.length} Drivers
              </Badge>
              <Badge variant="outline" className="gap-1">
                Total: {totalJobs}
              </Badge>
              <Badge variant="default" className="gap-1">
                Assigned: {assignedJobs}
              </Badge>
              <Badge variant="destructive" className="gap-1">
                Unassigned: {unassignedJobsCount}
              </Badge>
            </div>

            {/* Timeline Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="timeline-view" className="text-sm">Timeline</Label>
              <Switch
                id="timeline-view"
                checked={timelineView}
                onCheckedChange={setTimelineView}
              />
            </div>

            {/* Current Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(currentTime, 'h:mm:ss a')}
            </div>

            {/* Scroll Controls for Timeline */}
            {timelineView && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollHorizontal('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollHorizontal('right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollVertical('up')}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollVertical('down')}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Reorder Drivers Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDriverOrderModalOpen(true)}
            >
              Reorder Drivers
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          {timelineView ? (
            /* Timeline View */
            <div className="h-full flex flex-col">
              <TimelineGrid />
              
              <div 
                ref={verticalScrollRef}
                className="flex-1 overflow-auto"
              >
                <div 
                  ref={horizontalScrollRef}
                  className="overflow-x-auto min-w-full"
                >
                  <div className="space-y-1 pb-4">
                    {/* Driver swim lanes */}
                    {drivers.map((driver) => (
                      <DriverSwimLane
                        key={driver.id}
                        driver={driver}
                        jobs={jobsByDriver[driver.id] || []}
                        onJobView={onJobView}
                        timelineView={true}
                      />
                    ))}
                    
                    {/* Unassigned jobs section */}
                    <UnassignedJobsSection
                      jobs={unassignedJobs}
                      onJobView={onJobView}
                      timelineView={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Grid View */
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Driver swim lanes */}
                {drivers.map((driver) => (
                  <DriverSwimLane
                    key={driver.id}
                    driver={driver}
                    jobs={jobsByDriver[driver.id] || []}
                    onJobView={onJobView}
                    timelineView={false}
                  />
                ))}
                
                {/* Unassigned jobs section */}
                <UnassignedJobsSection
                  jobs={unassignedJobs}
                  onJobView={onJobView}
                  timelineView={false}
                />
              </div>
            </ScrollArea>
          )}
        </DragDropContext>
      </div>

      {/* Driver Order Modal */}
      <DriverOrderModal
        isOpen={isDriverOrderModalOpen}
        onClose={() => setIsDriverOrderModalOpen(false)}
        drivers={drivers}
        onSaveOrder={handleDriverOrderUpdate}
      />
    </div>
  );
};