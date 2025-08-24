import React, { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, User, Truck, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';

interface DispatchJobCardCompactProps {
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
    label: 'Delivery',
    icon: '📦'
  },
  pickup: { 
    color: 'bg-[hsl(var(--status-pickup))]', 
    borderColor: 'border-l-[hsl(var(--status-pickup))]', 
    label: 'Pickup',
    icon: '🚚'
  },
  'partial-pickup': { 
    color: 'bg-[hsl(var(--status-partial-pickup))]', 
    borderColor: 'border-l-[hsl(var(--status-partial-pickup))]', 
    label: 'Partial Pickup',
    icon: '📦'
  },
  service: { 
    color: 'bg-[hsl(var(--status-service))]', 
    borderColor: 'border-l-[hsl(var(--status-service))]', 
    label: 'Service',
    icon: '🔧'
  },
  'on-site-survey': { 
    color: 'bg-[hsl(var(--status-survey))]', 
    borderColor: 'border-l-[hsl(var(--status-survey))]', 
    label: 'Survey/Estimate',
    icon: '📋'
  },
  return: { 
    color: 'bg-[hsl(var(--status-cancelled))]', 
    borderColor: 'border-l-[hsl(var(--status-cancelled))]', 
    label: 'Return',
    icon: '↩️'
  }
};

export const DispatchJobCardCompact: React.FC<DispatchJobCardCompactProps> = ({
  job,
  onView,
  isDragging = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const jobTypeInfo = jobTypeConfig[job.job_type as keyof typeof jobTypeConfig] || jobTypeConfig.delivery;
  const statusInfo = getDualJobStatusInfo(job);

  const handleViewJob = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(job.id);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  if (isExpanded) {
    // Expanded view - same as the current DispatchJobCardList but with collapse button
    return (
      <div 
        className={cn(
          "bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md border-l-4 h-24 flex items-center px-3 gap-3 min-w-[280px]",
          isDragging && "shadow-lg border-blue-300 bg-blue-50",
          jobTypeInfo.borderColor
        )}
      >
        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleExpand}
          className="h-6 w-6 p-0 flex-shrink-0 hover:bg-gray-100"
        >
          <ChevronDown className="w-3 h-3" />
        </Button>

        {/* Job Type Indicator */}
        <div className={cn("w-3 h-3 rounded-full flex-shrink-0", jobTypeInfo.color)} />
        
        {/* Main Content */}
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-3 h-full py-2">
          {/* Left Column - Job Info */}
          <div className="min-w-0 space-y-0.5">
            {/* Job Number */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-900 truncate">
                {job.job_number}
              </span>
            </div>

            {/* Customer */}
            <div>
              <span className="font-semibold text-xs text-gray-700 truncate">
                {job.customers.name}
              </span>
            </div>

            {/* Location & Time Row */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {job.customers.service_street && (
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {job.customers.service_street}
                    {job.customers.service_city && `, ${job.customers.service_city}`}
                  </span>
                </div>
              )}
              {job.scheduled_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
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
            </div>

            {/* Driver & Vehicle Row */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {job.profiles && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="truncate">
                    {job.profiles.first_name} {job.profiles.last_name}
                  </span>
                </div>
              )}
              {job.vehicles && (
                <div className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-gray-400" />
                  <span className="truncate">
                    {job.vehicles.license_plate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Status Badges & View Button */}
          <div className="flex flex-col items-end justify-center gap-1">
            {/* Status Badges */}
            <div className="flex flex-col gap-1">
              <Badge className={cn("text-xs px-1.5 py-0.5 font-bold text-center whitespace-nowrap", statusInfo.primary.gradient)}>
                {statusInfo.primary.label}
              </Badge>
              {statusInfo.secondary && (
                <Badge className={cn("text-xs px-1.5 py-0.5 font-bold text-center whitespace-nowrap", statusInfo.secondary.gradient)}>
                  {statusInfo.secondary.label}
                </Badge>
              )}
            </div>
            
            {/* View Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewJob}
              className="h-6 px-2 text-xs border-gray-300 hover:bg-gray-50"
              aria-label={`View job ${job.job_number}`}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Compact view - job type text with badges underneath
  return (
    <div 
      className={cn(
        "bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md border-l-4 h-20 flex flex-col items-center justify-start px-2 py-1 gap-1 min-w-[80px] cursor-pointer",
        isDragging && "shadow-lg border-blue-300 bg-blue-50",
        jobTypeInfo.borderColor
      )}
      onClick={handleToggleExpand}
    >
      {/* Expand Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 flex-shrink-0 hover:bg-gray-100"
      >
        <ChevronRight className="w-3 h-3" />
      </Button>

      {/* Job Type Text - Bold */}
      <div className="text-xs font-bold text-gray-700 text-center leading-tight">
        {jobTypeInfo.label}
      </div>

      {/* Status Badges Container - Under job type */}
      <div className="flex flex-col items-center gap-0.5">
        <Badge className={cn("text-xs px-1.5 py-0 font-bold text-center whitespace-nowrap leading-tight", statusInfo.primary.gradient)}>
          {statusInfo.primary.label}
        </Badge>

        {/* Secondary Status Badge if available */}
        {statusInfo.secondary && (
          <Badge className={cn("text-xs px-1 py-0 font-bold text-center whitespace-nowrap leading-tight", statusInfo.secondary.gradient)}>
            {statusInfo.secondary.label}
          </Badge>
        )}
      </div>
    </div>
  );
};