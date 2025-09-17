import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, GripVertical, MapPin, Clock } from 'lucide-react';
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
        "p-4 transition-all border-l-4 relative bg-white shadow-sm",
        jobTypeConfig.color.replace('bg-', 'border-l-'),
        timelineView ? "w-[200px] flex-shrink-0" : "w-full",
        isOverdue && "border-red-500",
        job.status === 'completed' && "border-green-500",
        isDragging && "ring-2 ring-blue-300 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      {timelineView && (
        <div 
          {...dragHandleProps}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-60 hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      
      <div className="space-y-3 pr-6">
        {/* Job Number and Customer Name */}
        <div className="space-y-1">
          <div className="font-semibold text-sm text-foreground">
            {job.job_number}
          </div>
          {job.customers?.company_name && (
            <div className="text-sm text-foreground font-medium">
              {job.customers.company_name}
            </div>
          )}
        </div>

        {/* Location */}
        {job.service_address && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">
              {job.service_address}
            </span>
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {scheduledTime || format(new Date(job.scheduled_date), 'h:mm a')}
          </span>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.color} className="text-xs">
            {statusConfig.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
          {isPriority && (
            <Badge variant="destructive" className="text-xs">
              Priority
            </Badge>
          )}
        </div>

        {/* View Details Button */}
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            onJobView(job.id);
          }}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};