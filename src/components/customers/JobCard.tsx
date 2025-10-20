import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronRight, MoreVertical, Eye, Edit, FileText, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface JobCardProps {
  job: {
    id: string;
    job_number: string;
    job_type: 'delivery' | 'pickup' | 'service' | 'return';
    scheduled_date: string;
    scheduled_time?: string | null;
    status: string;
    total_price?: number | null;
    profiles?: {
      first_name: string;
      last_name: string;
    } | null;
    maintenance_reports?: any[];
  };
}

const JOB_STATUSES = {
  assigned: { label: 'Assigned', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  unassigned: { label: 'Unassigned', gradient: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  in_progress: { label: 'In Progress', gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
  completed: { label: 'Completed', gradient: 'bg-gradient-to-r from-green-500 to-green-600' },
  cancelled: { label: 'Cancelled', gradient: 'bg-gradient-to-r from-red-500 to-red-600' },
} as const;

const JOB_TYPES = {
  delivery: { label: 'Delivery', icon: '📦' },
  pickup: { label: 'Pickup', icon: '🚚' },
  service: { label: 'Service', icon: '🪣' },
  return: { label: 'Partial Pickup', icon: '↩️' },
} as const;

export function JobCard({ job }: JobCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const jobType = JOB_TYPES[job.job_type] || { label: job.job_type, icon: '📋' };
  const status = JOB_STATUSES[job.status as keyof typeof JOB_STATUSES] || { label: job.status, gradient: 'bg-gradient-to-r from-gray-500 to-gray-600' };

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Header Row - Job ID and Chevron */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm font-semibold">{job.job_number}</span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit Job
              </DropdownMenuItem>
              {job.maintenance_reports && job.maintenance_reports.length > 0 && (
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Metadata Row - Type and Status Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="outline" className="text-sm whitespace-nowrap">
          <span className="mr-1">{jobType.icon}</span>
          {jobType.label}
        </Badge>
        <Badge className={`text-white font-medium text-sm whitespace-nowrap ${status.gradient}`}>
          {status.label}
        </Badge>
      </div>

      {/* Date & Time */}
      <div className="mb-3">
        <p className="text-sm font-medium">
          {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
        </p>
        {job.scheduled_time && (
          <p className="text-sm text-muted-foreground">{job.scheduled_time}</p>
        )}
      </div>

      {/* Assigned Driver */}
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">Assigned Driver</p>
        <p className="text-sm font-medium">
          {job.profiles ? `${job.profiles.first_name} ${job.profiles.last_name}` : 'Unassigned'}
        </p>
      </div>

      {/* Reports Indicator */}
      {job.maintenance_reports && job.maintenance_reports.length > 0 && (
        <div className="mb-3">
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            {job.maintenance_reports.length} Report{job.maintenance_reports.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Total Price */}
      {job.total_price && (
        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-base font-semibold">{formatCurrency(job.total_price)}</span>
        </div>
      )}
    </Card>
  );
}
