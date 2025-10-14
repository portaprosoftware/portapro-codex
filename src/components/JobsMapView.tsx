import React from 'react';
import { SimpleJobsMapView } from '@/components/jobs/SimpleJobsMapView';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  jobType?: string;
  status?: string;
  selectedDate: Date;
  mapMode: 'standard' | 'driver' | 'today';
  onMapModeChange: (mode: 'standard' | 'driver' | 'today') => void;
}

export function JobsMapView({ 
  searchTerm, 
  selectedDriver, 
  jobType, 
  status, 
  selectedDate, 
  mapMode, 
  onMapModeChange 
}: JobsMapViewProps) {
  return (
    <SimpleJobsMapView
      searchTerm={searchTerm}
      selectedDriver={selectedDriver}
      jobType={jobType}
      status={status}
      selectedDate={selectedDate}
      mapMode={mapMode}
      onMapModeChange={onMapModeChange}
    />
  );
}

export default JobsMapView;