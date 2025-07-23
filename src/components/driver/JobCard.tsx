
import React from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JobStatus } from '@/types';

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: JobStatus;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  customers: {
    name?: string;
    business_name?: string;
  } | null;
}

interface JobCardProps {
  job: Job;
  onStatusUpdate: () => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const JobCard: React.FC<JobCardProps> = ({ job, onStatusUpdate }) => {
  const customerName = job.customers?.business_name || job.customers?.name || 'Unknown Customer';
  const customerInitials = customerName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleNavigate = () => {
    // This will be implemented with map integration
    console.log('Navigate to job:', job.id);
  };

  const handleCall = () => {
    // This will be implemented with customer contact integration
    console.log('Call customer for job:', job.id);
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {customerInitials}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 truncate">
                {customerName}
              </h3>
              <p className="text-sm text-gray-600">
                {job.job_number} • {job.job_type}
              </p>
            </div>
          </div>
          
          <Badge className={statusColors[job.status]}>
            {job.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {format(new Date(job.scheduled_date), 'MMM d')}
            {job.scheduled_time && ` at ${job.scheduled_time}`}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            Service Location
          </div>
        </div>

        {job.notes && (
          <p className="text-sm text-gray-600 mb-4 truncate">
            {job.notes}
          </p>
        )}

        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleNavigate}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Navigate
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleCall}
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
