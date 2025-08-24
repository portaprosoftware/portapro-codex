
import React, { useState } from 'react';
import { format } from 'date-fns';
import { formatDateSafe } from '@/lib/dateUtils';
import { MapPin, Clock, Phone, Navigation, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JobStatus } from '@/types';
import { JobDetailModal } from './JobDetailModal';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  customer_id: string;
  driver_id?: string;
  assigned_template_ids?: any;
  default_template_id?: string;
  was_overdue?: boolean;
  customers: {
    name?: string;
  } | null;
}

interface JobCardProps {
  job: Job;
  onStatusUpdate: () => void;
}


export const JobCard: React.FC<JobCardProps> = ({ job, onStatusUpdate }) => {
  const [showDetail, setShowDetail] = useState(false);
  const customerName = job.customers?.name || 'Unknown Customer';
  const statusInfo = getDualJobStatusInfo(job);
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

  const handleStartJob = async () => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', job.id);

      if (error) throw error;

      toast.success('Job started successfully');
      onStatusUpdate();
      
      // TODO: Launch service report form
      console.log('Launch service report form for job:', job.id);
    } catch (error) {
      console.error('Error starting job:', error);
      toast.error('Failed to start job');
    }
  };

  const handleCompleteJob = async () => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          actual_completion_time: new Date().toISOString()
        })
        .eq('id', job.id);

      if (error) throw error;

      toast.success('Job completed successfully');
      onStatusUpdate();
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Failed to complete job');
    }
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
            
            <div className="flex flex-col gap-1">
              <Badge className={`${statusInfo.primary.gradient} text-white border-0 font-medium px-3 py-1 rounded-full`}>
                {statusInfo.primary.label}
              </Badge>
              {statusInfo.secondary && (
                <Badge className={`${statusInfo.secondary.gradient} text-white border-0 font-medium px-3 py-1 rounded-full text-xs`}>
                  {statusInfo.secondary.label}
                </Badge>
              )}
              {statusInfo.priority && (
                <Badge className={`${statusInfo.priority.gradient} text-white border-0 font-medium px-2 py-0.5 rounded-full text-xs`}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {statusInfo.priority.label}
                </Badge>
              )}
            </div>
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

          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* Primary Action Button */}
            {job.status === 'assigned' && (
              <Button 
                size="lg" 
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-white font-semibold py-3"
                onClick={handleStartJob}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Job
              </Button>
            )}
            
            {job.status === 'in_progress' && (
              <Button 
                size="lg" 
                className="w-full bg-gradient-green hover:bg-gradient-green/90 text-white font-semibold py-3"
                onClick={handleCompleteJob}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete Job
              </Button>
            )}
            
            {/* Secondary Actions */}
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
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
