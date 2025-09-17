import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Clock, Users, MapPin, Maximize2, X, Calendar } from 'lucide-react';
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
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimelineGrid } from './TimelineGrid';
import { DriverSwimLane } from './DriverSwimLane';
import { UnassignedJobsPanel } from './UnassignedJobsPanel';
import { DispatchMetrics } from './DispatchMetrics';
import { DispatchFilters } from './DispatchFilters';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface FullScreenDispatchViewProps {
  jobs: any[];
  drivers: any[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onJobAssignment: (result: DropResult) => void;
  onJobView: (jobId: string) => void;
}

export const FullScreenDispatchView: React.FC<FullScreenDispatchViewProps> = ({
  jobs,
  drivers,
  selectedDate,
  onDateChange,
  onJobAssignment,
  onJobView
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timelineView, setTimelineView] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Separate assigned and unassigned jobs
  const { assignedJobs, unassignedJobs } = useMemo(() => {
    const assigned = jobs.filter(job => job.driver_id);
    const unassigned = jobs.filter(job => !job.driver_id);
    return { assignedJobs: assigned, unassignedJobs: unassigned };
  }, [jobs]);

  // Group jobs by driver
  const jobsByDriver = useMemo(() => {
    const grouped = new Map<string, any[]>();
    
    assignedJobs.forEach(job => {
      const driverId = job.driver_id;
      if (!grouped.has(driverId)) {
        grouped.set(driverId, []);
      }
      grouped.get(driverId)!.push(job);
    });
    
    return grouped;
  }, [assignedJobs]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const activeDrivers = new Set(assignedJobs.map(job => job.driver_id)).size;
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    return {
      totalJobs,
      completedJobs,
      activeDrivers,
      totalDrivers: drivers.length,
      unassignedCount: unassignedJobs.length,
      completionRate
    };
  }, [jobs, drivers, assignedJobs, unassignedJobs]);

  const handleQuickFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

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

            {/* Filters Section */}
            <div className="flex-shrink-0 border-b">
              <DispatchFilters
                selectedDate={selectedDate}
                onDateChange={onDateChange}
                jobsCount={jobs.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedDriver={selectedDriver}
                onDriverChange={setSelectedDriver}
                selectedJobType={selectedJobType}
                onJobTypeChange={setSelectedJobType}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                drivers={drivers}
                onQuickFilter={handleQuickFilter}
                activeFilters={activeFilters}
              />
            </div>

            {/* Metrics Row */}
            <div className="flex-shrink-0 border-b bg-background px-4">
              <DispatchMetrics metrics={metrics} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Unassigned Jobs */}
              <div className="w-80 border-r bg-muted/30 flex flex-col">
                <UnassignedJobsPanel 
                  jobs={unassignedJobs}
                  onJobView={onJobView}
                  timelineView={timelineView}
                />
              </div>

              {/* Center Panel - Driver Swim Lanes */}
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

              {/* Right Panel - Quick Actions & Stats */}
              <div className="w-64 border-l bg-muted/30 p-4">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Auto-Assign
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <MapPin className="h-4 w-4 mr-2" />
                        Route Optimization
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Driver Status</h3>
                    <div className="space-y-2">
                      {drivers.slice(0, 5).map(driver => {
                        const driverJobs = jobsByDriver.get(driver.id) || [];
                        const workload = driverJobs.length;
                        return (
                          <div key={driver.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">
                              {driver.first_name} {driver.last_name}
                            </span>
                            <Badge 
                              variant={workload > 3 ? "destructive" : workload > 1 ? "default" : "secondary"}
                              className="ml-2"
                            >
                              {workload}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </DragDropContext>
      </DrawerContent>
    </Drawer>
  );
};