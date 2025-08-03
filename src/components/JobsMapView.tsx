import React from 'react';
import { SimpleJobsMapView } from '@/components/jobs/SimpleJobsMapView';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  jobType?: string;
  status?: string;
  selectedDate: Date;
  isDriverMode: boolean;
  onMapModeChange: (isDriverMode: boolean) => void;
}

export function JobsMapView({ 
  searchTerm, 
  selectedDriver, 
  jobType, 
  status, 
  selectedDate, 
  isDriverMode, 
  onMapModeChange 
}: JobsMapViewProps) {
  return (
    <SimpleJobsMapView
      searchTerm={searchTerm}
      selectedDriver={selectedDriver}
      jobType={jobType}
      status={status}
      selectedDate={selectedDate}
    />
  );
}

export default JobsMapView;