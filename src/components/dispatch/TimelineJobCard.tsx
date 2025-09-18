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
      className={cn(
        "p-2 transition-all border-l-4 relative bg-white shadow-sm", // reduced padding from p-3 to p-2
        jobTypeConfig.color,
        timelineView ? "w-[144px] flex-shrink-0 mx-auto" : "w-full", // reduced width from 180px to 144px (20% reduction)
        isOverdue && "border-red-500",
        job.status === 'completed' && "border-green-500",
        isDragging && "ring-2 ring-blue-300 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      {timelineView && (
        <div 
          {...dragHandleProps}
          className="absolute top-1.5 right-1.5 cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded opacity-60 hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
        </div>
      )}
      
      <div className="space-y-1.5 pr-5"> {/* reduced spacing and right padding */}
        {/* Job Number and Customer Name */}
        <div className="space-y-0.5">
          <div className="font-semibold text-xs text-foreground"> {/* reduced from text-sm to text-xs */}
            {job.job_number}
          </div>
          {job.customers?.name && (
            <div className="text-xs text-foreground font-medium"> {/* reduced from text-sm to text-xs */}
              {job.customers.name}
            </div>
          )}
        </div>

        {/* Location */}
        {job.service_address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">
              {job.service_address}
            </span>
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          <span>
            {scheduledTime || scheduledDate || 'Unscheduled'}
          </span>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          <Badge variant={statusConfig.color} className="text-xs px-1.5 py-0.5">
            {statusConfig.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              Overdue
            </Badge>
          )}
          {isPriority && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              Priority
            </Badge>
          )}
        </div>

        {/* View Details Button */}
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs h-6 px-2" // reduced button height and font size
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