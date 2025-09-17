import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { User, MapPin, Clock, Truck } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TimelineJobCard } from './TimelineJobCard';
import { TIME_SLOTS, getTimeSlotForJob } from './TimelineGrid';
import { cn } from '@/lib/utils';

interface DriverSwimLaneProps {
  driver: any;
  jobs: any[];
  onJobView: (jobId: string) => void;
  timelineView: boolean;
  hideDriverInfo?: boolean;
}

export const DriverSwimLane: React.FC<DriverSwimLaneProps> = ({
  driver,
  jobs,
  onJobView,
  timelineView,
  hideDriverInfo = false
}) => {
  const workloadColor = jobs.length > 3 ? 'destructive' : jobs.length > 1 ? 'default' : 'secondary';

  // Group jobs by time slots for timeline view
  const jobsByTimeSlot = useMemo(() => {
    if (!timelineView) return { 'all': jobs };
    
    const grouped: Record<string, any[]> = {};
    
    // Initialize all time slots
    TIME_SLOTS.forEach(slot => {
      grouped[slot.id] = [];
    });
    
    // Group jobs by their time slots with error handling
    jobs.forEach(job => {
      try {
        const timeSlot = getTimeSlotForJob(job.scheduled_time);
        if (grouped[timeSlot]) {
          grouped[timeSlot].push(job);
        } else {
          // Fallback to no-time if slot doesn't exist
          grouped['no-time'].push(job);
        }
      } catch (error) {
        console.warn('Error grouping job by time slot:', job.id, error);
        grouped['no-time'].push(job);
      }
    });
    
    return grouped;
  }, [jobs, timelineView]);

  if (!timelineView) {
    // Vertical list view (original layout)
    return (
      <Card className="p-0 overflow-hidden">
        <div className="min-h-[120px]">
          <div className="flex flex-col">
            {/* Driver Info Column */}
            <div className="w-full border-b bg-background p-4">
              <div className="flex items-center justify-between h-full">
                <div className="font-medium text-sm">
                  {driver.first_name} {driver.last_name}
                </div>
                <Badge variant={workloadColor} className="text-xs">
                  {jobs.length} jobs
                </Badge>
              </div>
            </div>

            {/* Jobs Area */}
            <div className="flex-1 p-2">
              <Droppable droppableId={driver.id} direction="vertical" type="JOB">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[80px] p-2 rounded-md flex flex-col gap-2",
                      snapshot.isDraggingOver && "bg-muted/50 ring-2 ring-primary/20"
                    )}
                  >
                    {jobs.map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="w-full"
                          >
                            <TimelineJobCard
                              job={job}
                              onJobView={onJobView}
                              timelineView={false}
                              isDragging={snapshot.isDragging}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Empty state */}
                    {jobs.length === 0 && (
                      <div className="flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg h-16">
                        Drop jobs here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Horizontal timeline view - just slots, no card wrapper
  return (
    <div className="h-[120px] border-b flex">
      {TIME_SLOTS.map((slot) => (
        <div
          key={slot.id}
          className="border-r h-full bg-card"
          style={{ width: slot.width, minWidth: slot.width, flexShrink: 0 }}
        >
          <Droppable droppableId={`${driver.id}-${slot.id}`} direction="vertical" type="JOB">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "h-full p-1",
                  snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/20"
                )}
              >
                {slot.id === 'no-time' ? (
                  <div className="grid grid-cols-4 gap-1 h-full">
                    {jobsByTimeSlot[slot.id]?.map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="w-full"
                          >
                            <TimelineJobCard
                              job={job}
                              onJobView={onJobView}
                              timelineView={true}
                              isDragging={snapshot.isDragging}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {jobsByTimeSlot[slot.id]?.map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="w-full"
                          >
                            <TimelineJobCard
                              job={job}
                              onJobView={onJobView}
                              timelineView={true}
                              isDragging={snapshot.isDragging}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </div>
  );
};