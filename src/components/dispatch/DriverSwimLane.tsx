import React from 'react';
import { format } from 'date-fns';
import { User, MapPin, Clock, Truck } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TimelineJobCard } from './TimelineJobCard';
import { cn } from '@/lib/utils';

interface DriverSwimLaneProps {
  driver: any;
  jobs: any[];
  onJobView: (jobId: string) => void;
  timelineView: boolean;
}

// Calculate position based on scheduled time
const getJobTimePosition = (scheduledTime: string) => {
  if (!scheduledTime) return 0;
  
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const timelineStart = 6; // 6 AM
  const timelineEnd = 20; // 8 PM
  const timelineHours = timelineEnd - timelineStart;
  
  if (hours < timelineStart || hours > timelineEnd) {
    return 0;
  }
  
  const hoursFromStart = hours - timelineStart;
  const minutesAsHours = minutes / 60;
  const totalHoursFromStart = hoursFromStart + minutesAsHours;
  
  return (totalHoursFromStart / timelineHours) * 100;
};

export const DriverSwimLane: React.FC<DriverSwimLaneProps> = ({
  driver,
  jobs,
  onJobView,
  timelineView
}) => {
  const driverName = `${driver.first_name} ${driver.last_name}`;
  const workloadColor = jobs.length > 3 ? 'destructive' : jobs.length > 1 ? 'default' : 'secondary';

  return (
    <Card className="p-0 overflow-hidden">
      <div className={cn(
        "min-h-[80px]"
      )}>
        <div className={cn(
          "flex",
          timelineView ? "flex-row" : "flex-col"
        )}>
          {/* Driver Info Column */}
          <div className={cn(
            "border-r bg-background p-4 flex items-center gap-3",
            timelineView ? "w-48 flex-shrink-0" : "w-full border-b"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {driver.first_name?.[0]}{driver.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{driverName}</h4>
                <Badge variant={workloadColor} className="text-xs">
                  {jobs.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Truck className="h-3 w-3" />
                <span>Available</span>
              </div>
            </div>
          </div>

          {/* Jobs Area */}
          <div className={cn(
            "flex-1 p-2 relative",
            timelineView ? "min-h-[80px]" : "flex flex-col gap-2"
          )}>
            {timelineView ? (
              // Timeline view with positioned jobs
              <>
                <Droppable droppableId={driver.id} direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "w-full h-full relative",
                        snapshot.isDraggingOver && "bg-muted/50"
                      )}
                    >
                      {jobs.map((job, index) => {
                        const position = getJobTimePosition(job.scheduled_time);
                        return (
                          <Draggable key={job.id} draggableId={job.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "absolute transition-all",
                                  snapshot.isDragging && "opacity-95 rotate-1 scale-105 z-50 shadow-lg ring-2 ring-primary/20"
                                )}
                                style={{
                                  left: `${position}%`,
                                  top: '8px',
                                  ...provided.draggableProps.style
                                }}
                              >
                                <TimelineJobCard
                                  job={job}
                                  onJobView={onJobView}
                                  timelineView={timelineView}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </>
            ) : (
              // List view
              <Droppable droppableId={driver.id} direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex flex-col gap-2",
                      snapshot.isDraggingOver && "bg-muted/50"
                    )}
                  >
                    {jobs.map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "transition-all",
                              snapshot.isDragging && "opacity-95 rotate-1 scale-105 z-50 shadow-lg ring-2 ring-primary/20"
                            )}
                          >
                            <TimelineJobCard
                              job={job}
                              onJobView={onJobView}
                              timelineView={timelineView}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
            
            {/* Empty state */}
            {jobs.length === 0 && (
              <div className={cn(
                "flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg",
                timelineView ? "w-full h-16 absolute inset-2" : "h-16"
              )}>
                Drop jobs here
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};