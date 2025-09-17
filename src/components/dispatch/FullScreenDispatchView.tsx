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
import { EnhancedJobFilters } from '@/components/filters/EnhancedJobFilters';
import { DateRange } from 'react-day-picker';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface FullScreenDispatchViewProps {
  jobs: any[];
  drivers: any[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onJobAssignment: (result: DropResult) => void;
  onJobView: (jobId: string) => void;
  // Enhanced filter props
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedDriver: string;
  onDriverChange: (driver: string) => void;
  selectedJobType: string;
  onJobTypeChange: (type: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const FullScreenDispatchView: React.FC<FullScreenDispatchViewProps> = ({
  jobs,
  drivers,
  selectedDate,
  onDateChange,
  onJobAssignment,
  onJobView,
  dateRange,
  onDateRangeChange,
  searchTerm,
  onSearchTermChange,
  selectedDriver,
  onDriverChange,
  selectedJobType,
  onJobTypeChange,
  selectedStatus,
  onStatusChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timelineView, setTimelineView] = useState(true);

  // Process and filter jobs based on enhanced filters
  const { assignedJobs, unassignedJobs, jobsByDriver } = useMemo(() => {
    // Apply enhanced filters to jobs
    const filteredJobs = jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.customers?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDriver = selectedDriver === 'all' || job.driver_id === selectedDriver;
      const matchesJobType = selectedJobType === 'all' || job.job_type === selectedJobType;
      const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
      
      return matchesSearch && matchesDriver && matchesJobType && matchesStatus;
    });

    const assigned = filteredJobs.filter(job => job.driver_id);
    const unassigned = filteredJobs.filter(job => !job.driver_id);
    
    // Group assigned jobs by driver
    const byDriver = assigned.reduce((acc, job) => {
      if (!acc[job.driver_id]) {
        acc[job.driver_id] = [];
      }
      acc[job.driver_id].push(job);
      return acc;
    }, {} as Record<string, any[]>);
    
    return { assignedJobs: assigned, unassignedJobs: unassigned, jobsByDriver: byDriver };
  }, [jobs, searchTerm, selectedDriver, selectedJobType, selectedStatus]);


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

            {/* Enhanced Filters */}
            <div className="flex-shrink-0 border-b p-4">
              <EnhancedJobFilters
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
                searchTerm={searchTerm}
                onSearchTermChange={onSearchTermChange}
                selectedDriver={selectedDriver}
                onDriverChange={onDriverChange}
                selectedJobType={selectedJobType}
                onJobTypeChange={onJobTypeChange}
                selectedStatus={selectedStatus}
                onStatusChange={onStatusChange}
                drivers={drivers}
                jobs={jobs}
                onExport={() => {}} // TODO: Implement export for dispatch view
                resultsCount={assignedJobs.length + unassignedJobs.length}
                totalCount={jobs.length}
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
                        jobs={jobsByDriver[driver.id] || []}
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
                        const driverJobs = jobsByDriver[driver.id] || [];
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