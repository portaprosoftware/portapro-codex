import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useJobs } from '@/hooks/useJobs';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  jobType?: string;
  status?: string;
  selectedDate: Date;
}

const JobsMapPage = ({ searchTerm, selectedDriver, jobType, status, selectedDate }: JobsMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [serviceLocations, setServiceLocations] = useState<any[]>([]);
  const [selectedJobsAtLocation, setSelectedJobsAtLocation] = useState<any[]>([]);
  const [selectedJobForModal, setSelectedJobForModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Use the same data fetching as other views - this ensures data consistency
  const formatDateForQuery = (date: Date) => {
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
  };

  const { data: allJobs = [] } = useJobs({
    date: formatDateForQuery(selectedDate),
    job_type: jobType !== 'all' ? jobType : undefined,
    status: status !== 'all' ? status : undefined,
    driver_id: selectedDriver !== 'all' ? selectedDriver : undefined
  });

  // Apply the same filtering logic as other views
  const filterJobs = (jobs: any[]) => {
    return jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const filteredJobs = filterJobs(allJobs);

  // Get Mapbox token
  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await fetch(`https://unpnuonbndubcuzxfnmg.supabase.co/functions/v1/get-mapbox-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucG51b25ibmR1YmN1enhmbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkyMjgsImV4cCI6MjA2NDcxNTIyOH0.goME2hFzqxm0tnFdXAB_0evuiueh8wWfGLIY1vvvqmE`
          }
        });
        const data = await response.json();
        if (data.token) {
          setMapboxToken(data.token);
        } else {
          const stored = localStorage.getItem('mapbox-token');
          if (stored) setMapboxToken(stored);
        }
      } catch (error) {
        const stored = localStorage.getItem('mapbox-token');
        if (stored) setMapboxToken(stored);
      }
      setLoading(false);
    };
    getToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Changed to streets style
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Fetch service locations separately
  useEffect(() => {
    const fetchServiceLocations = async () => {
      try {
        const { data: locationsData } = await supabase
          .from('customer_service_locations')
          .select('id, customer_id, gps_coordinates');

        setServiceLocations(locationsData || []);
      } catch (error) {
        console.error('Service locations fetch error:', error);
        setServiceLocations([]);
      }
    };

    fetchServiceLocations();
  }, []);

  // Create pins with multiple jobs per location support
  useEffect(() => {
    if (!map.current || !filteredJobs.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoordinates = false;

    // Group jobs by customer location
    const jobsByLocation = new Map();
    
    filteredJobs.forEach(job => {
      const location = serviceLocations.find(loc => 
        loc.customer_id === job.customer_id && 
        loc.gps_coordinates
      );
      
      if (location?.gps_coordinates) {
        const key = `${job.customer_id}-${location.gps_coordinates}`;
        if (!jobsByLocation.has(key)) {
          jobsByLocation.set(key, {
            location,
            jobs: [],
            coordinates: null
          });
        }
        jobsByLocation.get(key).jobs.push(job);
      }
    });

    // Create pins for each location
    jobsByLocation.forEach(({ location, jobs, coordinates: _, customer_id }) => {
      // Parse coordinates from string format "(-81.83824,41.36749)"
      const coordStr = location.gps_coordinates.replace(/[()]/g, '');
      const [lng, lat] = coordStr.split(',').map(parseFloat);
      const coordinates: [number, number] = [lng, lat];

      if (!coordinates || isNaN(lng) || isNaN(lat)) return;

      hasCoordinates = true;
      bounds.extend(coordinates);

      // Pin colors - use first job's type for color, but show count
      const firstJob = jobs[0];
      const colors = {
        delivery: '#3B82F6',
        pickup: '#EF4444', 
        service: '#F59E0B',
        return: '#10B981'
      };

      const color = colors[firstJob.job_type] || '#6B7280';
      const count = jobs.length;

      // Create pin element with job count
      const pinEl = document.createElement('div');
      if (count === 1) {
        // Single job - show job type code
        const codes = {
          delivery: 'D',
          pickup: 'P',
          service: 'S', 
          return: 'R'
        };
        const code = codes[firstJob.job_type] || 'J';
        pinEl.innerHTML = `<div style="width: 28px; height: 28px; background-color: ${color}; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${code}</div>`;
      } else {
        // Multiple jobs - show count
        pinEl.innerHTML = `<div style="width: 32px; height: 32px; background-color: ${color}; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${count}</div>`;
      }

      // Click handler
      pinEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (jobs.length === 1) {
          setSelectedJobForModal(jobs[0].id);
        } else {
          setSelectedJobsAtLocation(jobs);
        }
      });

      // Add marker
      const marker = new mapboxgl.Marker(pinEl)
        .setLngLat(coordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (hasCoordinates) {
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [filteredJobs, serviceLocations]);

  if (loading) {
    return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!mapboxToken) {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div>Enter Mapbox Token:</div>
        <input 
          type="text" 
          placeholder="Mapbox token..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const token = (e.target as HTMLInputElement).value;
              localStorage.setItem('mapbox-token', token);
              setMapboxToken(token);
            }
          }}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>
    );
  }

  const getJobTypeColor = (type: string) => {
    const colors = {
      delivery: 'bg-blue-500',
      pickup: 'bg-red-500',
      service: 'bg-amber-500',
      return: 'bg-green-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      {/* Multiple Jobs Selection Slide Panel */}
      {selectedJobsAtLocation.length > 0 && (
        <>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 z-30"
            onClick={() => setSelectedJobsAtLocation([])}
          />
          
          {/* Slide Panel from Right */}
          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl border-l z-40 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">Jobs at Location</h3>
                  <p className="text-sm text-gray-600">
                    {selectedJobsAtLocation.length} job{selectedJobsAtLocation.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedJobsAtLocation([])}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Jobs List */}
            <div className="h-full overflow-y-auto pb-20">
              {selectedJobsAtLocation.map((job, index) => (
                <div key={job.id} className="p-4 border-b hover:bg-gray-50 transition-colors">
                  <div className="space-y-3">
                    {/* Job Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">{job.job_number}</span>
                      <div className="flex gap-1">
                        <Badge className={`${getJobTypeColor(job.job_type)} text-white`}>
                          {job.job_type}
                        </Badge>
                        <Badge className={getStatusColor(job.status)} variant="outline">
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Customer Info */}
                    <div>
                      <p className="font-medium text-gray-900">{job.customers?.name}</p>
                      <p className="text-sm text-gray-600">
                        {job.scheduled_date && format(new Date(job.scheduled_date), 'MMM d, yyyy')}
                        {job.scheduled_time && ` at ${job.scheduled_time}`}
                      </p>
                    </div>
                    
                    {/* Driver Info */}
                    {job.profiles && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Driver:</span> {job.profiles.first_name} {job.profiles.last_name}
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <Button 
                      onClick={() => {
                        setSelectedJobsAtLocation([]);
                        setSelectedJobForModal(job.id);
                      }}
                      className="w-full"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Job Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        jobId={selectedJobForModal}
        open={!!selectedJobForModal}
        onOpenChange={(open) => {
          if (!open) setSelectedJobForModal(null);
        }}
      />

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(255,255,255,0.9)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 10
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Job Types</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '50%' }}></div>
          <span>Delivery (D)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#EF4444', borderRadius: '50%' }}></div>
          <span>Pickup (P)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></div>
          <span>Service (S)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#10B981', borderRadius: '50%' }}></div>
          <span>Return (R)</span>
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          Jobs: {filteredJobs.length}
        </div>
      </div>
    </div>
  );
};

export default JobsMapPage;