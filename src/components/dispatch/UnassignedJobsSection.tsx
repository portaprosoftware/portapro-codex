import React, { useMemo } from 'react';
import { UserX } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TimelineJobCard } from './TimelineJobCard';
import { TIME_SLOTS, getTimeSlotForJob } from './TimelineGrid';
import { cn } from '@/lib/utils';

interface UnassignedJobsSectionProps {
  jobs: any[];
  onJobView: (jobId: string) => void;
  timelineView: boolean;
  stickyColumnOnly?: boolean;
}

export const UnassignedJobsSection: React.FC<UnassignedJobsSectionProps> = ({
  jobs,
  onJobView,
  timelineView,
  stickyColumnOnly = false
}) => {
  // Group unassigned jobs by time slots for timeline view
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
          grouped['no-time'].push(job);
        }
      } catch (error) {
        console.warn('Error grouping unassigned job by time slot:', job.id, error);
        grouped['no-time'].push(job);
      }
    });
    
    return grouped;
  }, [jobs, timelineView]);

  if (!timelineView) {
    // Vertical list view
    return (
      <Card className="p-0 overflow-hidden mb-4">
        <div className="min-h-[120px]">
          <div className="flex flex-col">
            {/* Unassigned Header */}
            <div className="w-full border-b bg-muted/30 p-4">
              <div className="flex items-center h-full">
                <div className="flex flex-col items-center justify-center gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-muted-foreground" />
                    <div className="font-medium text-sm text-center">Unassigned</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {jobs.length}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Jobs Area */}
            <div className="flex-1 p-2">
              <Droppable droppableId="unassigned" direction="vertical" type="JOB">
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
                        All jobs assigned
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

  // Sticky column only - just show the header (same height as driver cards)
  if (stickyColumnOnly) {
    return (
      <div className="h-[120px] p-2 border-b bg-muted/30 flex items-center">
        <div className="flex flex-col items-center justify-center gap-1 w-full">
          <div className="flex flex-col items-center">
            <UserX className="h-4 w-4 text-muted-foreground mb-1" />
            <div className="font-medium text-xs text-center">Unassigned</div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {jobs.length}
          </Badge>
        </div>
      </div>
    );
  }

  // Horizontal timeline view
  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border">
      <Card className="p-0 overflow-hidden rounded-none border-x-0 border-t-0">
        <div className="min-h-[120px]">
          <div className="flex flex-row">
            {/* Time Slots Area - Same layout as DriverSwimLane */}
            <div className="flex">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.id}
                  className="border-r min-h-[120px]"
                  style={{ width: slot.width, minWidth: slot.width, flexShrink: 0 }}
                >
                  <Droppable droppableId={`unassigned-${slot.id}`} direction="vertical" type="JOB">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "h-full p-1 flex flex-col gap-1",
                          snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/20",
                          slot.id === 'no-time' && "bg-muted/10"
                        )}
                      >
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
                        {provided.placeholder}
                        
                        {/* Empty state for time slots */}
                        {jobsByTimeSlot[slot.id]?.length === 0 && (
                          <div className="flex items-center justify-center text-muted-foreground text-xs border border-dashed border-muted/50 rounded h-8 text-center">
                            {slot.id === 'no-time' ? 'Drop here' : 'Available'}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};