
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Play, MapPin, Clock, User, Phone, MessageSquare, Package, Truck, Settings, RotateCcw, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDateSafe } from '@/lib/dateUtils';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';

interface JobCardProps {
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
  onEquipmentAssign?: (jobId: string) => void;
  compact?: boolean;
}

const jobTypeConfig = {
  delivery: {
    color: 'bg-[hsl(var(--status-delivery))]',
    lightColor: 'bg-[hsl(var(--status-delivery)/0.1)]',
    textColor: 'text-[hsl(var(--status-delivery))]',
    borderColor: 'border-l-[hsl(var(--status-delivery))]',
    icon: Truck,
    label: 'Delivery'
  },
  pickup: {
    color: 'bg-[hsl(var(--status-pickup))]',
    lightColor: 'bg-[hsl(var(--status-pickup)/0.1)]',
    textColor: 'text-[hsl(var(--status-pickup))]',
    borderColor: 'border-l-[hsl(var(--status-pickup))]',
    icon: Package,
    label: 'Pickup'
  },
  'partial-pickup': {
    color: 'bg-[hsl(var(--status-partial-pickup))]',
    lightColor: 'bg-[hsl(var(--status-partial-pickup)/0.1)]',
    textColor: 'text-[hsl(var(--status-partial-pickup))]',
    borderColor: 'border-l-[hsl(var(--status-partial-pickup))]',
    icon: Package,
    label: 'Partial Pickup'
  },
  service: {
    color: 'bg-[hsl(var(--status-service))]',
    lightColor: 'bg-[hsl(var(--status-service)/0.1)]',
    textColor: 'text-[hsl(var(--status-service))]',
    borderColor: 'border-l-[hsl(var(--status-service))]',
    icon: Settings,
    label: 'Service'
  },
  'on-site-survey': {
    color: 'bg-[hsl(var(--status-survey))]',
    lightColor: 'bg-[hsl(var(--status-survey)/0.1)]',
    textColor: 'text-[hsl(var(--status-survey))]',
    borderColor: 'border-l-[hsl(var(--status-survey))]',
    icon: Eye,
    label: 'On-Site Survey/Estimate'
  },
  return: {
    color: 'bg-[hsl(var(--status-cancelled))]',
    lightColor: 'bg-[hsl(var(--status-cancelled)/0.1)]',
    textColor: 'text-[hsl(var(--status-cancelled))]',
    borderColor: 'border-l-[hsl(var(--status-cancelled))]',
    icon: RotateCcw,
    label: 'Return'
  }
};

const statusConfig = {
  assigned: { 
    gradient: 'bg-gradient-blue', 
    label: 'Assigned' 
  },
  in_progress: { 
    gradient: 'bg-gradient-orange', 
    label: 'In Progress' 
  },
  'in-progress': { 
    gradient: 'bg-gradient-orange', 
    label: 'In Progress' 
  },
  completed: { 
    gradient: 'bg-gradient-green', 
    label: 'Completed' 
  },
  completed_late: { 
    gradient: 'bg-gradient-to-r from-gray-500 to-gray-600', 
    label: 'Job Completed Late' 
  },
  cancelled: { 
    gradient: 'bg-gradient-red', 
    label: 'Cancelled' 
  },
  overdue: { 
    gradient: 'bg-gradient-red', 
    label: 'Overdue' 
  }
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onView,
  onEquipmentAssign,
  compact = false
}) => {
  // Use unified dual status logic
  const statusInfo = getDualJobStatusInfo(job);
  const jobTypeInfo = jobTypeConfig[job.job_type as keyof typeof jobTypeConfig] || jobTypeConfig.delivery;
  const JobTypeIcon = jobTypeInfo.icon;

  const handleViewJob = () => {
    onView?.(job.id);
  };


  if (compact) {
    return (
      <div 
        className={cn(
          "enterprise-job-card group cursor-pointer border-l-4",
          jobTypeInfo.borderColor,
          job.job_type
        )}
        tabIndex={0}
        role="button"
        aria-label={`Job ${job.job_number} for ${job.customers.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleViewJob();
          }
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              jobTypeInfo.color
            )}>
              <JobTypeIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="enterprise-card-title text-sm mb-0">{job.job_number}</span>
                <span className="enterprise-caption-text">•</span>
                <span className="enterprise-card-title text-sm truncate mb-0">{job.customers.name}</span>
              </div>
              <div className={cn("enterprise-caption-text font-medium", jobTypeInfo.textColor)}>
                {jobTypeInfo.label}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Badge className={`${statusInfo.primary.gradient} text-white border-0 font-bold px-3 py-1 rounded-full text-center flex items-center justify-center`}>
              {statusInfo.primary.label}
            </Badge>
            {statusInfo.secondary && (
              <Badge className={`${statusInfo.secondary.gradient} text-white border-0 font-bold px-2 py-0.5 rounded-full text-xs text-center flex items-center justify-center`}>
                {statusInfo.secondary.label}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-1 mb-3">
          <div className="flex items-center enterprise-caption-text">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatDateSafe(job.scheduled_date, 'short')}</span>
            {job.scheduled_time && <span> at {job.scheduled_time}</span>}
          </div>
          {job.profiles && (
            <div className="flex items-center enterprise-caption-text">
              <User className="w-3 h-3 mr-1" />
              <span>{job.profiles.first_name} {job.profiles.last_name}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewJob} 
            className="w-full text-xs"
            aria-label={`View job ${job.job_number}`}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "enterprise-job-card group cursor-pointer border-l-4",
        jobTypeInfo.borderColor,
        job.job_type
      )}
      tabIndex={0}
      role="button"
      aria-label={`Job ${job.job_number} for ${job.customers.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleViewJob();
        }
      }}
    >
      <div className="mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
              jobTypeInfo.color
            )}>
              <JobTypeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="enterprise-card-title mb-1">{job.job_number}</h3>
              <span className={cn("enterprise-caption-text font-medium", jobTypeInfo.textColor)}>
                {jobTypeInfo.label}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Badge className={`${statusInfo.primary.gradient} text-white border-0 font-bold px-3 py-1 rounded-full text-center flex items-center justify-center`}>
              {statusInfo.primary.label}
            </Badge>
            {statusInfo.secondary && (
              <Badge className={`${statusInfo.secondary.gradient} text-white border-0 font-bold px-2 py-0.5 rounded-full text-xs text-center flex items-center justify-center`}>
                {statusInfo.secondary.label}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="enterprise-card-title mb-2">{job.customers.name}</h4>
          {job.customers.service_street && (
            <div className="flex items-start enterprise-body-text">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                {job.customers.service_street}
                {job.customers.service_city && `, ${job.customers.service_city}`}
                {job.customers.service_state && `, ${job.customers.service_state}`}
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center enterprise-body-text">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {formatDateSafe(job.scheduled_date, 'long')}
              {job.scheduled_time && ` at ${job.scheduled_time}`}
            </span>
          </div>
          
          {job.profiles && (
            <div className="flex items-center enterprise-body-text">
              <User className="w-4 h-4 mr-2" />
              <span>{job.profiles.first_name} {job.profiles.last_name}</span>
            </div>
          )}
        </div>
        
        {job.vehicles && (
          <div className="enterprise-body-text">
            <strong>Vehicle:</strong> {job.vehicles.license_plate} ({job.vehicles.vehicle_type})
          </div>
        )}
        
        {job.notes && (
          <div className="enterprise-body-text bg-gray-50 p-3 rounded-lg">
            <strong>Notes:</strong> {job.notes}
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewJob} 
            className="flex-1"
            aria-label={`View details for job ${job.job_number}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            aria-label={`Call customer for job ${job.job_number}`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            aria-label={`Message customer for job ${job.job_number}`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          
          {onEquipmentAssign && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEquipmentAssign(job.id)} 
              className="flex-1"
              aria-label={`Assign equipment to job ${job.job_number}`}
            >
              <Package className="w-4 h-4 mr-2" />
              Equipment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
