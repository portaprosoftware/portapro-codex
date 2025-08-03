import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useJobs } from '@/hooks/useJobs';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink, Satellite, Map as MapIcon, Radar } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getDriverColor, getJobTypeColor, getStatusBorderColor } from '@/components/maps/MapLegend';
import { isJobOverdue, shouldShowPriorityBadge } from '@/lib/jobStatusUtils';
import { useQuery } from '@tanstack/react-query';
import { formatDateForQuery } from '@/lib/dateUtils';
import { SimpleWeatherRadar } from '@/components/jobs/SimpleWeatherRadar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  jobType?: string;
  status?: string;
  selectedDate: Date;
  isDriverMode: boolean;
  onMapModeChange: (isDriverMode: boolean) => void;
}

const JobsMapPage = ({ searchTerm, selectedDriver, jobType, status, selectedDate, isDriverMode, onMapModeChange }: JobsMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [serviceLocations, setServiceLocations] = useState<any[]>([]);
  const [selectedJobsAtLocation, setSelectedJobsAtLocation] = useState<any[]>([]);
  const [selectedJobForModal, setSelectedJobForModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [radarEnabled, setRadarEnabled] = useState(false);
  
  // Track if multi-job dialog is open to control pin interactions
  const isMultiJobDialogOpen = selectedJobsAtLocation.length > 0;

  // CRITICAL FIX: Clear phantom dialog states on unmount and route changes
  useEffect(() => {
    // Clear dialog states when component mounts (defensive)
    setSelectedJobsAtLocation([]);
    setSelectedJobForModal(null);

    // Cleanup function to clear states on unmount
    return () => {
      setSelectedJobsAtLocation([]);
      setSelectedJobForModal(null);
    };
  }, []);

  // CRITICAL FIX: Clear dialog states when not on map routes
  useEffect(() => {
    const currentPath = window.location.pathname;
    const isMapRoute = currentPath.includes('/jobs') && currentPath.includes('map');
    
    if (!isMapRoute) {
      setSelectedJobsAtLocation([]);
      setSelectedJobForModal(null);
    }
  }, [window.location.pathname]);

  // Use the same data fetching as other views - this ensures data consistency

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

  // Get drivers for color mapping
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Helper function to get map style URL
  const getMapStyleUrl = (style: 'streets' | 'satellite') => {
    return style === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/streets-v12';
  };

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
      style: getMapStyleUrl(mapStyle),
      center: [-95.7129, 37.0902],
      zoom: 4,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update map style when changed
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(getMapStyleUrl(mapStyle));
    }
  }, [mapStyle]);

  // Fetch service locations - enhanced to include coordinate_ids referenced by jobs
  useEffect(() => {
    const fetchServiceLocations = async () => {
      try {
        // Get unique coordinate IDs from filtered jobs
        const coordinateIds = new Set();
        const customerIds = new Set();
        
        filteredJobs.forEach(job => {
          customerIds.add(job.customer_id);
          if (job.selected_coordinate_ids && Array.isArray(job.selected_coordinate_ids)) {
            job.selected_coordinate_ids.forEach(id => coordinateIds.add(id));
          }
        });

        if (customerIds.size === 0) {
          setServiceLocations([]);
          return;
        }

        // Fetch locations that are either default for customers with jobs OR referenced in selected_coordinate_ids
        const query = supabase
          .from('customer_service_locations')
          .select(`
            id,
            customer_id,
            gps_coordinates,
            location_name,
            is_default
          `);

        // Build OR condition for locations
        const conditions = [];
        
        // Include default locations for customers with jobs
        if (customerIds.size > 0) {
          conditions.push(`customer_id.in.(${Array.from(customerIds).join(',')}),is_default.eq.true`);
        }
        
        // Include specific locations referenced by jobs
        if (coordinateIds.size > 0) {
          conditions.push(`id.in.(${Array.from(coordinateIds).join(',')})`);
        }

        const { data: locations } = await query.or(conditions.join(','));

        console.log('Fetched service locations:', locations?.length);
        
        // Log locations without GPS coordinates for debugging
        const locationsWithoutGPS = locations?.filter(loc => !loc.gps_coordinates) || [];
        if (locationsWithoutGPS.length > 0) {
          console.warn('Service locations without GPS coordinates:', locationsWithoutGPS.map(loc => ({
            name: loc.location_name,
            customer_id: loc.customer_id,
            id: loc.id
          })));
        }

        setServiceLocations(locations || []);
      } catch (error) {
        console.error('Service locations fetch error:', error);
        setServiceLocations([]);
      }
    };

    fetchServiceLocations();
  }, [filteredJobs]);

  // Create pins with enhanced styling based on mode
  useEffect(() => {
    if (!map.current || !filteredJobs.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoordinates = false;

    // Group jobs by customer location - enhanced logic
    const jobsByLocation = new Map();
    const jobsWithoutLocation = [];
    
    filteredJobs.forEach(job => {
      let location = null;
      
      // First, try to find location using selected_coordinate_ids
      if (job.selected_coordinate_ids && Array.isArray(job.selected_coordinate_ids) && job.selected_coordinate_ids.length > 0) {
        location = serviceLocations.find(loc => 
          job.selected_coordinate_ids.includes(loc.id) && 
          loc.gps_coordinates
        );
      }
      
      // If no coordinate-specific location found, fall back to default location
      if (!location) {
        location = serviceLocations.find(loc => 
          loc.customer_id === job.customer_id && 
          loc.is_default && 
          loc.gps_coordinates
        );
      }
      
      if (location?.gps_coordinates) {
        const key = `${location.id}-${location.gps_coordinates}`;
        if (!jobsByLocation.has(key)) {
          jobsByLocation.set(key, {
            location,
            jobs: []
          });
        }
        jobsByLocation.get(key).jobs.push(job);
      } else {
        jobsWithoutLocation.push({
          job_number: job.job_number,
          customer_name: job.customers?.name,
          selected_coordinate_ids: job.selected_coordinate_ids
        });
      }
    });

    // Debug logging for jobs without locations
    if (jobsWithoutLocation.length > 0) {
      console.warn('Jobs without valid GPS coordinates:', jobsWithoutLocation);
    }

    // Create pins for each location
    jobsByLocation.forEach(({ location, jobs }) => {
      // Parse coordinates from string format "(-81.83824,41.36749)"
      const coordStr = location.gps_coordinates.replace(/[()]/g, '');
      const [lng, lat] = coordStr.split(',').map(parseFloat);
      const coordinates: [number, number] = [lng, lat];

      if (!coordinates || isNaN(lng) || isNaN(lat)) return;

      hasCoordinates = true;
      bounds.extend(coordinates);

      const firstJob = jobs[0];
      const count = jobs.length;

      // Create pin element with enhanced styling
      const pinEl = document.createElement('div');
      
      if (count === 1) {
        // Single job marker with status border
        const fillColor = isDriverMode 
          ? getDriverColor(firstJob.driver_id || 'unassigned', drivers)
          : getJobTypeColor(firstJob.job_type);
        
        const borderColor = getStatusBorderColor(
          firstJob.status, 
          isJobOverdue(firstJob), 
          shouldShowPriorityBadge(firstJob)
        );

        const displayText = isDriverMode 
          ? (drivers.find(d => d.id === firstJob.driver_id)?.first_name?.charAt(0) || 'U')
          : firstJob.job_type.charAt(0).toUpperCase();

        pinEl.innerHTML = `
          <div style="
            width: 32px; 
            height: 32px; 
            background-color: ${fillColor}; 
            border: 3px solid ${borderColor}; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 12px; 
            cursor: pointer; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            transition: transform 0.2s ease;
            pointer-events: ${isMultiJobDialogOpen ? 'none' : 'auto'};
          " 
          onmouseover="this.style.transform='scale(1.1)'" 
          onmouseout="this.style.transform='scale(1)'"
          >${displayText}</div>
        `;
      } else {
        // Multiple jobs cluster - use dominant color and status
        const dominantColor = isDriverMode
          ? getDriverColor(firstJob.driver_id || 'unassigned', drivers) 
          : '#374151'; // gray-700 for multi-job clusters
        
        // Get dominant status for border
        const hasOverdue = jobs.some(job => isJobOverdue(job));
        const hasPriority = jobs.some(job => shouldShowPriorityBadge(job));
        const hasInProgress = jobs.some(job => job.status === 'in_progress');
        
        let borderColor = '#6B7280'; // gray-500 default
        if (hasOverdue) borderColor = '#EF4444'; // red-500
        else if (hasPriority) borderColor = '#F59E0B'; // amber-500  
        else if (hasInProgress) borderColor = '#EAB308'; // yellow-500

        pinEl.innerHTML = `
          <div style="
            width: 36px; 
            height: 36px; 
            background-color: ${dominantColor}; 
            border: 3px solid ${borderColor}; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 13px; 
            cursor: pointer; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            transition: transform 0.2s ease;
            pointer-events: ${isMultiJobDialogOpen ? 'none' : 'auto'};
          "
          onmouseover="this.style.transform='scale(1.1)'" 
          onmouseout="this.style.transform='scale(1)'"
          >${count}</div>
        `;
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
  }, [filteredJobs, serviceLocations, isDriverMode, drivers, isMultiJobDialogOpen]);

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
    <div className="relative w-full h-full">{/* Remove fixed 400px height */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      
      {/* Weather Radar */}
      {map.current && (
        <SimpleWeatherRadar 
          map={map.current} 
          isActive={radarEnabled} 
        />
      )}
      
      {/* Map Style Toggle and Radar */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center gap-0.5 bg-white p-1 rounded-lg shadow-lg border">
          <Button
            variant={mapStyle === 'streets' ? "default" : "ghost"}
            size="sm"
            onClick={() => setMapStyle('streets')}
            className="h-8 px-3 text-sm font-medium"
          >
            <MapIcon className="w-4 h-4 mr-1.5" />
            Streets
          </Button>
          <Button
            variant={mapStyle === 'satellite' ? "default" : "ghost"}
            size="sm"
            onClick={() => setMapStyle('satellite')}
            className="h-8 px-3 text-sm font-medium"
          >
            <Satellite className="w-4 h-4 mr-1.5" />
            Satellite
          </Button>
          
          {/* Radar Toggle - Inline */}
          <div className="flex items-center px-2">
            <Switch
              id="radar-toggle"
              checked={radarEnabled}
              onCheckedChange={setRadarEnabled}
            />
            <Label htmlFor="radar-toggle" className="text-sm font-medium flex items-center ml-2">
              <Radar className="w-4 h-4 mr-1" />
              Radar
            </Label>
          </div>
        </div>
      </div>
      
      
      {/* Multiple Jobs Modal */}
      <Dialog 
        open={selectedJobsAtLocation.length > 0} 
        onOpenChange={(open) => {
          if (!open) setSelectedJobsAtLocation([]);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden"
          onPointerDownOutside={() => setSelectedJobsAtLocation([])}
          onEscapeKeyDown={() => setSelectedJobsAtLocation([])}
        >
          <DialogHeader>
            <DialogTitle>
              Jobs at Location - {selectedJobsAtLocation.length} job{selectedJobsAtLocation.length !== 1 ? 's' : ''} found
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            {selectedJobsAtLocation.map((job, index) => (
              <Card key={job.id} className="p-4">
                <div className="space-y-3">
                  {/* Job Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{job.job_number}</h4>
                      <p className="text-gray-600">{job.customers?.name}</p>
                      <p className="text-sm text-gray-500">
                        {job.scheduled_date && format(new Date(job.scheduled_date), 'MMM d, yyyy')}
                        {job.scheduled_time && ` at ${job.scheduled_time}`}
                      </p>
                    </div>
                     <div className="flex gap-2">
                       <Badge variant="info">
                         {job.job_type}
                       </Badge>
                       <Badge variant={job.status as any}>
                         {job.status}
                       </Badge>
                     </div>
                  </div>
                  
                  {/* Driver Info */}
                  {job.profiles && (
                    <p className="text-sm">
                      <span className="font-medium">Driver:</span> {job.profiles.first_name} {job.profiles.last_name}
                    </p>
                  )}
                  
                  {/* Action Button */}
                  <Button 
                    onClick={() => {
                      setSelectedJobsAtLocation([]);
                      setSelectedJobForModal(job.id);
                    }}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Job Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Detail Modal */}
      <JobDetailModal
        jobId={selectedJobForModal}
        open={!!selectedJobForModal}
        onOpenChange={(open) => {
          if (!open) setSelectedJobForModal(null);
        }}
      />

    </div>
  );
};

export default JobsMapPage;