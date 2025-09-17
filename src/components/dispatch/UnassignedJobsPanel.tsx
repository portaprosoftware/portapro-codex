import React from 'react';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimelineJobCard } from './TimelineJobCard';
import { cn } from '@/lib/utils';
import { isJobOverdue, shouldShowPriorityBadge } from '@/lib/jobStatusUtils';

interface UnassignedJobsPanelProps {
  jobs: any[];
  onJobView: (jobId: string) => void;
  timelineView: boolean;
}

export const UnassignedJobsPanel: React.FC<UnassignedJobsPanelProps> = ({
  jobs,
  onJobView,
  timelineView
}) => {
  const overdueJobs = jobs.filter(job => isJobOverdue(job));
  const priorityJobs = jobs.filter(job => shouldShowPriorityBadge(job));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Unassigned Jobs</h3>
          <Badge variant="secondary">{jobs.length}</Badge>
        </div>
        
        {/* Alert indicators */}
        <div className="flex gap-2">
          {overdueJobs.length > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overdueJobs.length} Overdue
            </Badge>
          )}
          {priorityJobs.length > 0 && (
            <Badge variant="default" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {priorityJobs.length} Priority
            </Badge>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <ScrollArea className="flex-1">
        <Droppable droppableId="unassigned" direction="vertical">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "p-4 space-y-3",
                snapshot.isDraggingOver && "bg-muted/50"
              )}
            >
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No unassigned jobs</p>
                </div>
              ) : (
                jobs.map((job, index) => (
                  <Draggable key={job.id} draggableId={job.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "transition-all",
                          snapshot.isDragging && "opacity-75 rotate-2 scale-105 z-50"
                        )}
                      >
                        <TimelineJobCard
                          job={job}
                          onJobView={onJobView}
                          timelineView={false}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </ScrollArea>
    </div>
  );
};