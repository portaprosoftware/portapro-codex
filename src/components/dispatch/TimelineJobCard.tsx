import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, MapPin, Clock } from 'lucide-react';
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
    delivery: { color: 'border-l-blue-500', label: 'Delivery', icon: '📦' },
    pickup: { color: 'border-l-orange-500', label: 'Pickup', icon: '🔄' },
    service: { color: 'border-l-purple-500', label: 'Service', icon: '🔧' },
    'on-site-survey': { color: 'border-l-red-800', label: 'Survey', icon: '📋' }
  };
  return configs[jobType] || { color: 'border-l-gray-500', label: 'Job', icon: '📋' };
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

  // Safe date formatting utility
  const formatDateSafe = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM d');
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return null;
    }
  };

  // Safe time formatting utility
  const formatTimeSafe = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
    } catch (error) {
      console.warn('Invalid time format:', timeString);
      return null;
    }
  };

  const scheduledTime = formatTimeSafe(job.scheduled_time);
  const scheduledDate = formatDateSafe(job.scheduled_date);

  return (
    <Card
      {...dragHandleProps}
      className={cn(
        "p-3 transition-all border-l-4 relative bg-white shadow-sm cursor-grab active:cursor-grabbing",
        jobTypeConfig.color,
        timelineView ? "w-[180px] flex-shrink-0 mx-auto" : "w-full",
        isOverdue && "border-red-500",
        job.status === 'completed' && "border-green-500",
        isDragging && "ring-2 ring-blue-300 shadow-lg cursor-grabbing"
      )}
    >
      <div className="space-y-2">
        {/* Job Number and Customer Name */}
        <div className="space-y-1">
          <div className="font-semibold text-sm text-foreground">
            {job.job_number}
          </div>
          {job.customers?.name && (
            <div className="text-sm text-foreground font-medium">
              {job.customers.name}
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
            {scheduledTime || scheduledDate || 'Unscheduled'}
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