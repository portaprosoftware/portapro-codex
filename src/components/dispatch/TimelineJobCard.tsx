import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isJobOverdue, shouldShowPriorityBadge } from '@/lib/jobStatusUtils';

interface TimelineJobCardProps {
  job: any;
  onJobView: (jobId: string) => void;
  timelineView: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const getJobTypeConfig = (jobType: string) => {
  const configs = {
    delivery: { color: 'bg-blue-500', label: 'Delivery', icon: '📦' },
    pickup: { color: 'bg-green-500', label: 'Pickup', icon: '🔄' },
    service: { color: 'bg-purple-500', label: 'Service', icon: '🔧' },
    'on-site-survey': { color: 'bg-orange-500', label: 'Survey', icon: '📋' }
  };
  return configs[jobType] || { color: 'bg-gray-500', label: 'Job', icon: '📋' };
};

const getStatusConfig = (status: string) => {
  const configs = {
    unassigned: { color: 'secondary', label: 'Unassigned' },
    assigned: { color: 'default', label: 'Assigned' },
    in_progress: { color: 'default', label: 'In Progress' },
    completed: { color: 'default', label: 'Completed' },
    cancelled: { color: 'destructive', label: 'Cancelled' }
  };
  return configs[status] || { color: 'secondary', label: status };
};

export const TimelineJobCard: React.FC<TimelineJobCardProps> = ({
  job,
  onJobView,
  timelineView,
  isDragging = false,
  dragHandleProps
}) => {
  const jobTypeConfig = getJobTypeConfig(job.job_type);
  const statusConfig = getStatusConfig(job.status);
  const isOverdue = isJobOverdue(job);
  const isPriority = shouldShowPriorityBadge(job);

  const scheduledTime = job.scheduled_time 
    ? format(new Date(`2000-01-01T${job.scheduled_time}`), 'h:mm a')
    : null;

  return (
    <Card
      className={cn(
        "p-2 transition-all border-l-4 relative",
        jobTypeConfig.color.replace('bg-', 'border-l-'),
        timelineView ? "w-[110px] flex-shrink-0" : "w-full",
        isOverdue && "border-red-500 bg-red-50",
        job.status === 'completed' && "bg-green-50 border-green-500",
        isDragging && "ring-2 ring-blue-300 shadow-lg bg-white"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...dragHandleProps}
        className="absolute top-1 right-1 cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded opacity-60 hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      
      <div className="space-y-1 pr-4">
        {/* Job ID */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm truncate">{job.job_number}</span>
          <div className="flex gap-0.5">
            {job.status === 'completed' && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
            {isOverdue && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </div>
        </div>

        {/* Time */}
        {scheduledTime && (
          <div className="text-xs text-muted-foreground font-medium">
            {scheduledTime}
          </div>
        )}

        {/* Status Badge */}
        <Badge variant={statusConfig.color} className="text-xs w-full justify-center">
          {statusConfig.label}
        </Badge>

        {/* Priority/Overdue Badge */}
        {(isPriority || isOverdue) && (
          <div className="space-y-1">
            {isPriority && (
              <Badge variant="destructive" className="text-xs w-full justify-center">
                Priority
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-xs w-full justify-center">
                Overdue
              </Badge>
            )}
          </div>
        )}

        {/* View Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-6 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onJobView(job.id);
          }}
        >
          View
        </Button>
      </div>
    </Card>
  );
};