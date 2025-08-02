import React from 'react';
import { format } from 'date-fns';
import { formatDateSafe } from '@/lib/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, User, Calendar, Package } from 'lucide-react';
import { isJobOverdue, isJobCompletedLate, shouldShowWasOverdueBadge, shouldShowPriorityBadge } from '@/lib/jobStatusUtils';

interface Job {
  id: string;
  job_number: string;
  scheduled_date: string;
  job_type: string;
  status: string;
  was_overdue?: boolean;
  completed_at?: string;
  driver_id?: string;
  customers?: {
    id: string;
    name: string;
    service_street?: string;
    service_city?: string;
    service_state?: string;
  };
  profiles?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
  vehicles?: {
    id: string;
    license_plate?: string;
    vehicle_type?: string;
  };
}

interface CustomJobsListProps {
  jobs: Job[];
  onJobClick: (jobId: string) => void;
}

export const CustomJobsList: React.FC<CustomJobsListProps> = ({
  jobs,
  onJobClick
}) => {
  const getStatusBadge = (job: Job) => {
    const badges = [];

    // Priority badge
    if (shouldShowPriorityBadge(job)) {
      badges.push(
        <Badge key="priority" variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Priority
        </Badge>
      );
    }

    // Was overdue badge  
    if (shouldShowWasOverdueBadge(job)) {
      badges.push(
        <Badge key="was-overdue" variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Was Overdue
        </Badge>
      );
    }

    // Current overdue badge
    if (isJobOverdue(job)) {
      badges.push(
        <Badge key="overdue" variant="destructive">
          Overdue
        </Badge>
      );
    }

    // Completed late badge
    if (isJobCompletedLate(job)) {
      badges.push(
        <Badge key="completed-late" variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
          Completed Late
        </Badge>
      );
    }

    // Main status badge
    const statusColors = {
      unassigned: 'bg-gray-100 text-gray-800 border-gray-200',
      assigned: 'bg-blue-100 text-blue-800 border-blue-200', 
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    badges.push(
      <Badge 
        key="status" 
        variant="secondary" 
        className={statusColors[job.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}
      >
        {job.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );

    return badges;
  };

  if (jobs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No jobs found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or date range.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              {/* Job Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-semibold text-lg">{job.job_number}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(job)}
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{formatDateSafe(job.scheduled_date, 'long')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Type:</span>
                  <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Driver:</span>
                  <span>
                    {job.profiles 
                      ? `${job.profiles.first_name || ''} ${job.profiles.last_name || ''}`.trim()
                      : 'Unassigned'
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Customer:</span>
                  <span>{job.customers?.name || 'Unknown'}</span>
                </div>
              </div>

              {/* Address */}
              {job.customers?.service_street && (
                <div className="text-sm text-muted-foreground">
                  {job.customers.service_street}
                  {job.customers.service_city && `, ${job.customers.service_city}`}
                  {job.customers.service_state && `, ${job.customers.service_state}`}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onJobClick(job.id)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};