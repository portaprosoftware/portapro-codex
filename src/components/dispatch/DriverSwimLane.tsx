import React from 'react';
import { format } from 'date-fns';
import { User, MapPin, Clock, Truck } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TimelineJobCard } from './TimelineJobCard';
import { cn } from '@/lib/utils';

interface DriverSwimLaneProps {
  driver: any;
  jobs: any[];
  onJobView: (jobId: string) => void;
  timelineView: boolean;
}

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
        "min-h-[120px]"
      )}>
        <div className={cn(
          "flex",
          timelineView ? "flex-row" : "flex-col"
        )}>
          {/* Driver Info Column */}
          <div className={cn(
            "border-r bg-background p-4",
            timelineView ? "w-32 flex-shrink-0" : "w-full border-b"
          )}>
            {/* Driver Names and Badge */}
            <div className="flex items-center h-full">
              <div className="flex flex-col items-center justify-center gap-1 w-full">
                <div className="flex flex-col items-center">
                  <div className="font-medium text-sm text-center">{driver.first_name}</div>
                  <div className="font-medium text-sm text-center">{driver.last_name}</div>
                </div>
                <Badge variant={workloadColor} className="text-xs">
                  {jobs.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Jobs Area */}
          <div className={cn(
            "flex-1 p-2",
            timelineView ? "flex flex-row gap-2 min-h-[120px] items-center overflow-x-auto" : "flex flex-col gap-2"
          )}>
            <Droppable droppableId={driver.id} direction={timelineView ? "horizontal" : "vertical"} type="JOB">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-[80px] p-2 rounded-md",
                    timelineView ? "flex flex-row gap-2" : "flex flex-col gap-2",
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
                            timelineView={timelineView}
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
                    <div className={cn(
                      "flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg",
                      timelineView ? "min-w-[200px] h-16" : "h-16"
                    )}>
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
};