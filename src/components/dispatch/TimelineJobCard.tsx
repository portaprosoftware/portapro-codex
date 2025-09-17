import React from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isJobOverdue, shouldShowPriorityBadge } from '@/lib/jobStatusUtils';

interface TimelineJobCardProps {
  job: any;
  onJobView: (jobId: string) => void;
  timelineView: boolean;
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
  timelineView
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
        "p-3 transition-all border-l-4",
        jobTypeConfig.color.replace('bg-', 'border-l-'),
        timelineView ? "min-w-[240px] max-w-[280px]" : "w-full",
        isOverdue && "border-red-500 bg-red-50",
        job.status === 'completed' && "bg-green-50 border-green-500"
      )}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{jobTypeConfig.icon}</span>
            <span className="font-semibold text-sm">{job.job_number}</span>
          </div>
          <div className="flex gap-1">
            {job.status === 'completed' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {isOverdue && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Status and Time */}
        <div className="flex items-center justify-between">
          <Badge variant={statusConfig.color} className="text-xs">
            {statusConfig.label}
          </Badge>
          {scheduledTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {scheduledTime}
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="space-y-1">
          <p className="font-medium text-sm truncate">
            {job.customers?.name || 'Unknown Customer'}
          </p>
          {job.customers?.service_street && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {job.customers.service_street}, {job.customers.service_city}
              </span>
            </div>
          )}
        </div>

        {/* Priority Indicators */}
        {(isPriority || isOverdue) && (
          <div className="flex gap-1">
            {isPriority && (
              <Badge variant="destructive" className="text-xs">
                Priority
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
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