
import React, { useState } from 'react';
import { format } from 'date-fns';
import { formatDateSafe } from '@/lib/dateUtils';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JobStatus } from '@/types';
import { JobDetailModal } from './JobDetailModal';

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  customers: {
    name?: string;
  } | null;
}

interface JobCardProps {
  job: Job;
  onStatusUpdate: () => void;
}

const statusColors = {
  pending: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0',
  assigned: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0',
  'in-progress': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0',
  completed: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0',
  cancelled: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0'
};

export const JobCard: React.FC<JobCardProps> = ({ job, onStatusUpdate }) => {
  const [showDetail, setShowDetail] = useState(false);
  const customerName = job.customers?.name || 'Unknown Customer';
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
    <>
      <Card className="bg-white shadow-sm" onClick={() => setShowDetail(true)}>
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
            
            <Badge className={`${statusColors[job.status as keyof typeof statusColors] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0'} font-medium px-3 py-1 rounded-full`}>
              {job.status.replace(/-/g, ' ')}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              {formatDateSafe(job.scheduled_date, 'short')}
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

          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
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

      <JobDetailModal 
        job={job}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onStatusUpdate={onStatusUpdate}
      />
    </>
  );
};
