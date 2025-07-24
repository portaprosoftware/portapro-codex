import React from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, User, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DispatchJobCardProps {
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
  onClick?: () => void;
  isDragging?: boolean;
}

const jobTypeConfig = {
  delivery: { color: 'bg-emerald-500', label: 'Delivery' },
  pickup: { color: 'bg-blue-500', label: 'Pickup' },
  service: { color: 'bg-orange-500', label: 'Service' },
  return: { color: 'bg-purple-500', label: 'Return' }
};

const statusConfig = {
  assigned: { color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white', label: 'Assigned' },
  in_progress: { color: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white', label: 'In Progress' },
  completed: { color: 'bg-gradient-to-r from-green-500 to-green-600 text-white', label: 'Completed' },
  overdue: { color: 'bg-gradient-to-r from-red-500 to-red-600 text-white', label: 'Overdue' },
  cancelled: { color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', label: 'Cancelled' }
};

export const DispatchJobCard: React.FC<DispatchJobCardProps> = ({
  job,
  onClick,
  isDragging = false
}) => {
  const jobTypeInfo = jobTypeConfig[job.job_type as keyof typeof jobTypeConfig] || jobTypeConfig.delivery;
  const statusInfo = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.assigned;

  return (
    <div 
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md dispatch-job-card w-full max-w-full",
        isDragging && "shadow-lg border-blue-300 bg-blue-50"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", jobTypeInfo.color)} />
          <span className="font-medium text-sm text-gray-900 truncate">
            {job.job_number}
          </span>
        </div>
        <Badge className={cn("text-xs px-2 py-0.5 flex-shrink-0 font-bold", statusInfo.color)}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Customer Name */}
      <div className="mb-2">
        <p className="font-semibold text-sm text-gray-900 truncate">
          {job.customers.name}
        </p>
        <p className="text-xs text-gray-600 capitalize">
          {jobTypeInfo.label}
        </p>
      </div>

      {/* Location */}
      {job.customers.service_street && (
        <div className="flex items-start mb-2">
          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0 mr-1" />
          <p className="text-xs text-gray-600 line-clamp-2 break-words overflow-hidden">
            {job.customers.service_street}
            {job.customers.service_city && `, ${job.customers.service_city}`}
          </p>
        </div>
      )}

      {/* Time */}
      <div className="flex items-center mb-2">
        <Clock className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
        <span className="text-xs text-gray-600">
          {job.scheduled_time || '9:00 AM'}
        </span>
      </div>

      {/* Driver */}
      {job.profiles && (
        <div className="flex items-center mb-2">
          <User className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate">
            {job.profiles.first_name} {job.profiles.last_name}
          </span>
        </div>
      )}

      {/* Vehicle */}
      {job.vehicles && (
        <div className="flex items-center">
          <Truck className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate">
            {job.vehicles.license_plate}
          </span>
        </div>
      )}

      {/* Notes - if present, show truncated */}
      {job.notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 line-clamp-2 break-words overflow-hidden">
            {job.notes}
          </p>
        </div>
      )}
    </div>
  );
};