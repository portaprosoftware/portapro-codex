
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Play, MapPin, Clock, User, Phone, MessageSquare } from 'lucide-react';
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
  compact?: boolean;
}

const statusColors = {
  assigned: 'bg-[#3366FF] text-white',
  in_progress: 'bg-[#FF9933] text-white',
  completed: 'bg-[#33CC66] text-white',
  cancelled: 'bg-red-500 text-white',
  pending: 'bg-yellow-500 text-white'
};

const jobTypeColors = {
  delivery: 'text-blue-600',
  pickup: 'text-green-600',
  service: 'text-orange-600'
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onView,
  onStart,
  onStatusUpdate,
  compact = false
}) => {
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

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      pending: 'Pending'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getJobTypeLabel = (type: string) => {
    const labels = {
      delivery: 'Delivery',
      pickup: 'Pickup',
      service: 'Service'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm">{job.job_number}</span>
              <Badge className={cn("text-xs", statusColors[job.status as keyof typeof statusColors] || 'bg-gray-500 text-white')}>
                {getStatusLabel(job.status)}
              </Badge>
            </div>
            <span className={cn("text-xs font-medium", jobTypeColors[job.job_type as keyof typeof jobTypeColors] || 'text-gray-600')}>
              {getJobTypeLabel(job.job_type)}
            </span>
          </div>
          
          <div className="space-y-1 mb-3">
            <p className="font-medium text-sm text-gray-900">{job.customers.name}</p>
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="w-3 h-3 mr-1" />
              {format(new Date(job.scheduled_date), 'MMM d')}
              {job.scheduled_time && ` at ${job.scheduled_time}`}
            </div>
            {job.profiles && (
              <div className="flex items-center text-xs text-gray-600">
                <User className="w-3 h-3 mr-1" />
                {job.profiles.first_name} {job.profiles.last_name}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleViewJob} className="flex-1 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button 
              size="sm" 
              onClick={handleStartJob}
              className="flex-1 bg-gradient-to-r from-[#3366FF] to-[#6699FF] hover:from-[#2952CC] hover:to-[#5580E6] text-white text-xs"
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{job.job_number}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", statusColors[job.status as keyof typeof statusColors] || 'bg-gray-500 text-white')}>
              {getStatusLabel(job.status)}
            </Badge>
            <span className={cn("text-sm font-medium", jobTypeColors[job.job_type as keyof typeof jobTypeColors] || 'text-gray-600')}>
              {getJobTypeLabel(job.job_type)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">{job.customers.name}</h4>
          {job.customers.service_street && (
            <div className="flex items-start text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
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
            <span>
              {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
              {job.scheduled_time && ` at ${job.scheduled_time}`}
            </span>
          </div>
          
          {job.profiles && (
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span>{job.profiles.first_name} {job.profiles.last_name}</span>
            </div>
          )}
        </div>
        
        {job.vehicles && (
          <div className="text-sm text-gray-600">
            <strong>Vehicle:</strong> {job.vehicles.license_plate} ({job.vehicles.vehicle_type})
          </div>
        )}
        
        {job.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <strong>Notes:</strong> {job.notes}
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleViewJob} className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          
          <Button variant="outline" size="sm" className="flex-1">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleStartJob}
            className="flex-1 bg-gradient-to-r from-[#3366FF] to-[#6699FF] hover:from-[#2952CC] hover:to-[#5580E6] text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            {job.status === 'assigned' ? 'Start Job' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
