
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Play, MapPin, Clock, User, Phone, MessageSquare, Package, Truck, Settings, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  assigned: { color: 'bg-blue-500', label: 'Assigned' },
  in_progress: { color: 'bg-orange-500', label: 'In Progress' },
  completed: { color: 'bg-green-500', label: 'Completed' },
  cancelled: { color: 'bg-red-500', label: 'Cancelled' },
  pending: { color: 'bg-yellow-500', label: 'Pending' }
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onView,
  onStart,
  onStatusUpdate,
  onEquipmentAssign,
  compact = false
}) => {
  const jobTypeInfo = jobTypeConfig[job.job_type as keyof typeof jobTypeConfig] || jobTypeConfig.delivery;
  const statusInfo = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.pending;
  const JobTypeIcon = jobTypeInfo.icon;

  const handleViewJob = () => {
    onView?.(job.id);
  };

  const handleStartJob = () => {
    if (job.status === 'assigned') {
      onStatusUpdate?.(job.id, 'in_progress');
    } else {
      onStart?.(job.id);
    }
  };

  if (compact) {
    return (
      <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white border-l-4 border-l-transparent hover:border-l-blue-500">
        <CardContent className="p-4">
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
            
            <Badge className={cn("text-white text-xs font-inter", statusInfo.color)}>
              {statusInfo.label}
            </Badge>
          </div>
          
          <div className="space-y-1 mb-3">
            <div className="flex items-center enterprise-caption-text">
              <Clock className="w-3 h-3 mr-1" />
              <span>{format(new Date(job.scheduled_date), 'MMM d')}</span>
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
            <Button variant="outline" size="sm" onClick={handleViewJob} className="flex-1 text-xs font-inter">
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button 
              size="sm" 
              onClick={handleStartJob}
              className="flex-1 btn-enterprise text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              {job.status === 'assigned' ? 'Start' : 'View'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white border-l-4 border-l-transparent hover:border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
              jobTypeInfo.color
            )}>
              <JobTypeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold font-inter">{job.job_number}</CardTitle>
              <span className={cn("text-sm font-medium font-inter", jobTypeInfo.textColor)}>
                {jobTypeInfo.label}
              </span>
            </div>
          </div>
          <Badge className={cn("text-white font-inter", statusInfo.color)}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 font-inter">{job.customers.name}</h4>
          {job.customers.service_street && (
            <div className="flex items-start text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="font-inter">
                {job.customers.service_street}
                {job.customers.service_city && `, ${job.customers.service_city}`}
                {job.customers.service_state && `, ${job.customers.service_state}`}
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-inter">
              {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
              {job.scheduled_time && ` at ${job.scheduled_time}`}
            </span>
          </div>
          
          {job.profiles && (
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span className="font-inter">{job.profiles.first_name} {job.profiles.last_name}</span>
            </div>
          )}
        </div>
        
        {job.vehicles && (
          <div className="text-sm text-gray-600">
            <strong className="font-inter">Vehicle:</strong> <span className="font-inter">{job.vehicles.license_plate} ({job.vehicles.vehicle_type})</span>
          </div>
        )}
        
        {job.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong className="font-inter">Notes:</strong> <span className="font-inter">{job.notes}</span>
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleViewJob} className="flex-1 font-inter">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          
          <Button variant="outline" size="sm" className="flex-1 font-inter">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          
          <Button variant="outline" size="sm" className="flex-1 font-inter">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          
          {onEquipmentAssign && (
            <Button variant="outline" size="sm" onClick={() => onEquipmentAssign(job.id)} className="flex-1 font-inter">
              <Package className="w-4 h-4 mr-2" />
              Equipment
            </Button>
          )}
          
          <Button 
            size="sm" 
            onClick={handleStartJob}
            className="flex-1 btn-enterprise"
          >
            <Play className="w-4 h-4 mr-2" />
            {job.status === 'assigned' ? 'Start Job' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
