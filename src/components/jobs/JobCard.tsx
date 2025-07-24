
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Play, MapPin, Clock, User, Phone, MessageSquare, Package, Truck, Settings, RotateCcw, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDateSafe } from '@/lib/dateUtils';

interface JobCardProps {
  job: {
    id: string;
    job_number: string;
    job_type: string;
    status: string;
    scheduled_date: string;
    scheduled_time?: string;
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
  onStart?: (jobId: string) => void;
  onStatusUpdate?: (jobId: string, status: string) => void;
  onEquipmentAssign?: (jobId: string) => void;
  onReverse?: (jobId: string) => void;
  compact?: boolean;
}

const jobTypeConfig = {
  delivery: {
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-500',
    icon: Truck,
    label: 'Delivery'
  },
  pickup: {
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    icon: Package,
    label: 'Pickup'
  },
  service: {
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-500',
    icon: Settings,
    label: 'Service'
  },
  return: {
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-500',
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
  cancelled: { 
    gradient: 'bg-gradient-red', 
    label: 'Cancelled' 
  },
  pending: { 
    gradient: 'bg-gradient-yellow', 
    label: 'Pending' 
  },
  overdue: { 
    gradient: 'bg-gradient-red', 
    label: 'Overdue' 
  }
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onView,
  onStart,
  onStatusUpdate,
  onEquipmentAssign,
  onReverse,
  compact = false
}) => {
  // Determine display status with overdue logic
  const getDisplayStatus = (job: any) => {
    const currentDate = new Date();
    const scheduledDate = new Date(job.scheduled_date);
    
    // Only show overdue for assigned jobs that have passed their scheduled date
    // Don't override in-progress or completed jobs
    if (job.status === 'assigned' && scheduledDate < currentDate) {
      return 'overdue';
    }
    
    return job.status;
  };

  const displayStatus = getDisplayStatus(job);
  const jobTypeInfo = jobTypeConfig[job.job_type as keyof typeof jobTypeConfig] || jobTypeConfig.delivery;
  const statusInfo = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.pending;
  const JobTypeIcon = jobTypeInfo.icon;

  const handleViewJob = () => {
    onView?.(job.id);
  };

  const handleStartJob = () => {
    if (job.status === 'assigned') {
      onStatusUpdate?.(job.id, 'in-progress');
    } else if (job.status === 'in-progress') {
      onStatusUpdate?.(job.id, 'completed');
    }
    // If completed, do nothing (button will be disabled)
  };

  const getJobButtonText = () => {
    switch (job.status) {
      case 'assigned':
        return 'Start Job';
      case 'in-progress':
        return 'Complete Job';
      case 'completed':
        return 'Job Complete';
      default:
        return 'View Job';
    }
  };

  const isJobCompleted = job.status === 'completed';
  const showReverseButton = job.status === 'in-progress' || job.status === 'completed';

  const handleReverse = () => {
    if (job.status === 'completed') {
      onReverse?.(job.id);
      onStatusUpdate?.(job.id, 'in-progress');
    } else if (job.status === 'in-progress') {
      onReverse?.(job.id);
      onStatusUpdate?.(job.id, 'assigned');
    }
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "enterprise-job-card group cursor-pointer",
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
          
          <Badge className={`${statusInfo.gradient} text-white border-0 font-bold px-3 py-1 rounded-full`}>
            {statusInfo.label}
          </Badge>
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
        
        {showReverseButton && (
          <div className="mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReverse}
              className="w-full px-2 py-1 h-6 text-xs border-gray-300 hover:border-gray-400"
              aria-label={`Reverse job ${job.job_number}`}
            >
              <Undo2 className="w-3 h-3 mr-1" />
              Reverse
            </Button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewJob} 
            className="flex-1 text-xs"
            aria-label={`View job ${job.job_number}`}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            onClick={handleStartJob}
            disabled={isJobCompleted}
            className={`flex-1 text-xs ${isJobCompleted ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'}`}
            aria-label={`${getJobButtonText()} ${job.job_number}`}
          >
            {getJobButtonText()}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "enterprise-job-card group cursor-pointer",
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
          
          <Badge className={`${statusInfo.gradient} text-white border-0 font-bold px-3 py-1 rounded-full`}>
            {statusInfo.label}
          </Badge>
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
        
        {showReverseButton && (
          <div className="mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReverse}
              className="w-full px-3 py-2 border-gray-300 hover:border-gray-400"
              aria-label={`Reverse job ${job.job_number}`}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Reverse Job
            </Button>
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
          
          <Button 
            size="sm" 
            onClick={handleStartJob}
            disabled={isJobCompleted}
            className={`flex-1 ${isJobCompleted ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'}`}
            aria-label={`${getJobButtonText()} ${job.job_number}`}
          >
            {getJobButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
};
