import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';

interface UnassignedJobCardProps {
  job: {
    id: string;
    job_number: string;
    job_type: string;
    status: string;
    scheduled_date: string;
    scheduled_time?: string;
    actual_completion_time?: string;
    notes?: string;
    customers: {
      id: string;
      name: string;
      service_street?: string;
      service_city?: string;
      service_state?: string;
      service_zip?: string;
    };
    profiles?: {
      id: string;
      first_name: string;
      last_name: string;
    };
    vehicles?: {
      id: string;
      license_plate: string;
      vehicle_type: string;
    };
  };
  onView?: (jobId: string) => void;
  isDragging?: boolean;
}

const jobTypeConfig = {
  delivery: { 
    color: 'bg-[hsl(var(--status-delivery))]', 
    borderColor: 'border-l-[hsl(var(--status-delivery))]', 
    label: 'Delivery' 
  },
  pickup: { 
    color: 'bg-[hsl(var(--status-pickup))]', 
    borderColor: 'border-l-[hsl(var(--status-pickup))]', 
    label: 'Pickup' 
  },
  'partial-pickup': { 
    color: 'bg-[hsl(var(--status-partial-pickup))]', 
    borderColor: 'border-l-[hsl(var(--status-partial-pickup))]', 
    label: 'Partial Pickup' 
  },
  service: { 
    color: 'bg-[hsl(var(--status-service))]', 
    borderColor: 'border-l-[hsl(var(--status-service))]', 
    label: 'Service' 
  },
  'on-site-survey': { 
    color: 'bg-[hsl(var(--status-survey))]', 
    borderColor: 'border-l-[hsl(var(--status-survey))]', 
    label: 'Survey/Estimate' 
  },
  return: { 
    color: 'bg-[hsl(var(--status-cancelled))]', 
    borderColor: 'border-l-[hsl(var(--status-cancelled))]', 
    label: 'Return' 
  }
};

export const UnassignedJobCard: React.FC<UnassignedJobCardProps> = ({
  job,
  onView,
  isDragging = false
}) => {
  const jobTypeInfo = jobTypeConfig[job.job_type as keyof typeof jobTypeConfig] || jobTypeConfig.delivery;
  const statusInfo = getDualJobStatusInfo(job);

  const handleViewJob = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(job.id);
  };

  return (
    <div 
      className={cn(
        "bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md border-l-4 w-full p-3",
        isDragging && "shadow-lg border-blue-300 bg-blue-50",
        jobTypeInfo.borderColor
      )}
    >
      {/* Job Type Indicator */}
      <div className="flex items-start gap-3">
        <div className={cn("w-3 h-3 rounded-full flex-shrink-0 mt-1", jobTypeInfo.color)} />
        
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Job ID and Customer Name on separate rows */}
          <div className="space-y-1">
            <div className="font-medium text-sm text-gray-900">
              {job.job_number}
            </div>
            <div className="font-semibold text-sm text-gray-700">
              {job.customers.name}
            </div>
          </div>

          {/* Address - Multi-line display */}
          {job.customers.service_street && (
            <div className="space-y-1">
              <div className="flex items-start gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm">
                    {job.customers.service_street}
                  </span>
                  {job.customers.service_city && (
                    <span className="text-sm">
                      {job.customers.service_city}
                      {job.customers.service_state && `, ${job.customers.service_state}`}
                      {job.customers.service_zip && ` ${job.customers.service_zip}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Time */}
          {job.scheduled_time && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {(() => {
                  const [hours, minutes] = job.scheduled_time.split(':').map(Number);
                  const period = hours >= 12 ? 'PM' : 'AM';
                  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                })()}
              </span>
            </div>
          )}

          {/* Bottom Section - Badges & Button */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              <Badge className={cn("text-xs px-2 py-0.5 font-bold whitespace-nowrap", statusInfo.primary.gradient)}>
                {statusInfo.primary.label}
              </Badge>
              {statusInfo.secondary && (
                <Badge className={cn("text-xs px-2 py-0.5 font-bold whitespace-nowrap", statusInfo.secondary.gradient)}>
                  {statusInfo.secondary.label}
                </Badge>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewJob}
              className="px-3 py-1 text-xs border-gray-300 hover:bg-gray-50 w-full"
              aria-label={`View job ${job.job_number}`}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};