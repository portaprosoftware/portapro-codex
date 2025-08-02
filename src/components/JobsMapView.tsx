import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { formatDateForQuery } from '@/lib/dateUtils';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  selectedDate: Date;
}

const JobsMapView: React.FC<JobsMapViewProps> = ({
  searchTerm,
  selectedDriver,
  selectedJobType,
  selectedStatus,
  selectedDate,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<any>(null);

  // Format date for jobs query using unified date
  const dateString = formatDateForQuery(selectedDate);
  
  console.log('JobsMapView: Selected date:', dateString);
  console.log('JobsMapView: Query filters:', { 
    date: dateString, 
    status: selectedStatus, 
    driver_id: selectedDriver, 
    job_type: selectedJobType 
  });

  // Get jobs data with proper "all" filter handling
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs({
    date: dateString,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    driver_id: selectedDriver === 'all' ? undefined : selectedDriver,
    job_type: selectedJobType === 'all' ? undefined : selectedJobType,
  });

  // Enhanced debugging for jobs data
  console.log('JobsMapView: Jobs loading state:', jobsLoading);
  console.log('JobsMapView: Jobs error:', jobsError);
  console.log('JobsMapView: Jobs data:', jobs);
  console.log('JobsMapView: Jobs count:', jobs?.length || 0);
  
  // Log individual job details for debugging
  if (jobs && jobs.length > 0) {
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}:`, {
        job_number: job.job_number,
        customer_id: job.customer_id,
        customer_name: job.customers?.name,
        scheduled_date: job.scheduled_date,
        status: job.status,
        driver_id: job.driver_id,
        job_type: job.job_type
      });
    });
  }

  // Get Mapbox token
  useEffect(() => {
    const getToken = async () => {
      try {
        // Try Supabase edge function first
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
          localStorage.setItem('mapbox_token', data.token);
        } else {
          // Fallback to localStorage
          const storedToken = localStorage.getItem('mapbox_token');
          if (storedToken) {
            setMapboxToken(storedToken);
          }
        }
      } catch (error) {
        console.error('Failed to get Mapbox token:', error);
        // Try localStorage as fallback
        const storedToken = localStorage.getItem('mapbox_token');
        if (storedToken) {
          setMapboxToken(storedToken);
        }
      } finally {
        setTokenLoading(false);
      }
    };

    getToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    console.log('Initializing map with token:', mapboxToken.substring(0, 10) + '...');

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-81.83824, 41.36749], // Updated to match actual job coordinates
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Map loaded successfully');
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Add job pins to map
  useEffect(() => {
    console.log('Pin effect triggered:', {
      hasMap: !!map.current,
      mapLoaded: map.current?.loaded(),
      jobsCount: jobs?.length || 0,
      jobsLoading,
      jobsError
    });

    if (!map.current) {
      console.log('Map not initialized yet');
      return;
    }

    if (jobsLoading) {
      console.log('Jobs still loading, waiting...');
      return;
    }

    if (jobsError) {
      console.error('Jobs error:', jobsError);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs data available:', { 
        jobs: jobs,
        hasJobs: !!jobs,
        jobsLength: jobs?.length,
        isArray: Array.isArray(jobs)
      });
      return;
    }

    console.log('READY TO ADD PINS - All conditions met!');
    console.log('Starting to add pins for', jobs.length, 'jobs');

    const addPins = async () => {
      try {
        // Clear existing markers first
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach(marker => marker.remove());

        // Get service locations for customers
        const customerIds = [...new Set(jobs.map(job => job.customer_id))];
        console.log('Fetching locations for customer IDs:', customerIds);
        
        const { data: locations, error } = await supabase
          .from('customer_service_locations')
          .select('*')
          .in('customer_id', customerIds);

        if (error) {
          console.error('Error fetching service locations:', error);
          return;
        }

        console.log('Jobs:', jobs);
        console.log('Service locations:', locations);

        let pinsAdded = 0;
        const bounds = new mapboxgl.LngLatBounds();

        // Create pins for jobs with locations
        jobs.forEach((job) => {
          // First try to get coordinates from job itself
          let coordinates: [number, number] | null = null;
          
          if (job.selected_coordinate_ids && Array.isArray(job.selected_coordinate_ids) && job.selected_coordinate_ids.length > 0) {
            // TODO: Fetch coordinates from service_location_coordinates table
            console.log('Job has selected coordinates:', job.selected_coordinate_ids);
          }
          
          // Fallback to default service location
          if (!coordinates) {
            const location = locations?.find(loc => 
              loc.customer_id === job.customer_id && loc.is_default
            );

            if (location?.gps_coordinates) {
              // Parse GPS coordinates from (lng,lat) format
              const coordString = String(location.gps_coordinates);
              const coords = coordString.match(/\(([^)]+)\)/)?.[1];
              if (coords) {
                const [lng, lat] = coords.split(',').map(coord => parseFloat(coord.trim()));
                coordinates = [lng, lat];
                console.log(`Using default location for job ${job.job_number}: [${lng}, ${lat}]`);
              }
            }
          }

          // If we still don't have coordinates, try the customer's service address
          if (!coordinates && job.customers) {
            console.log(`No GPS coordinates for job ${job.job_number}, customer: ${job.customers.name}`);
            return;
          }

          if (coordinates) {
            const [lng, lat] = coordinates;
            
            // Status colors
            const statusColors: Record<string, string> = {
              'assigned': '#3b82f6',
              'in_progress': '#f59e0b', 
              'completed': '#10b981',
              'cancelled': '#ef4444',
            };

            // Create marker
            const marker = new mapboxgl.Marker({
              color: statusColors[job.status] || '#6b7280'
            })
              .setLngLat([lng, lat])
              .addTo(map.current!);

            // Add click handler with simplified data
            marker.getElement().addEventListener('click', () => {
              const pinData = {
                job_number: job.job_number,
                job_type: job.job_type,
                status: job.status,
                coordinates: [lng, lat],
                customer_name: job.customers?.name,
                driver_name: job.profiles ? `${job.profiles.first_name} ${job.profiles.last_name}` : null,
                vehicle_plate: job.vehicles?.license_plate,
                locationName: locations?.find(loc => 
                  loc.customer_id === job.customer_id && loc.is_default
                )?.location_name || 'Service Location',
              };
              setSelectedPin(pinData);
            });

            bounds.extend([lng, lat]);
            pinsAdded++;
            console.log(`Added pin ${pinsAdded} for job ${job.job_number} at [${lng}, ${lat}]`);
          }
        });

        console.log(`Total pins added: ${pinsAdded}`);

        // Fit map to show all pins if we have any
        if (pinsAdded > 0 && !bounds.isEmpty()) {
          map.current?.fitBounds(bounds, { 
            padding: 50,
            maxZoom: 15 
          });
          console.log('Map bounds fitted to show all pins');
        }
      } catch (error) {
        console.error('Error adding job pins:', error);
      }
    };

    // Wait for map to be loaded before adding pins
    if (map.current.loaded()) {
      addPins();
    } else {
      map.current.on('load', addPins);
    }
  }, [jobs]);

  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('token') as string;
    
    if (token) {
      localStorage.setItem('mapbox_token', token);
      setMapboxToken(token);
    }
  };

  const handleNavigateToLocation = (coordinates: [number, number]) => {
    const [lng, lat] = coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please enter your Mapbox public token to display the map.
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <input
              type="text"
              name="token"
              placeholder="pk.eyJ1..."
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <Button type="submit" className="w-full">
              Save Token
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">{/* Map view - date controlled by unified filter bar */}

      <div 
        ref={mapContainer} 
        className="w-full h-full min-h-[400px]"
        style={{ height: '100%', width: '100%' }}
      />
      
      {/* Selected pin details */}
      {selectedPin && (
        <Card className="absolute top-4 right-4 w-80 max-h-96 overflow-y-auto">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">{selectedPin.job_number}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPin(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div><strong>Customer:</strong> {selectedPin.customer_name}</div>
              <div><strong>Type:</strong> {selectedPin.job_type}</div>
              <div><strong>Status:</strong> {selectedPin.status}</div>
              <div><strong>Location:</strong> {selectedPin.locationName}</div>
              {selectedPin.driver_name && (
                <div><strong>Driver:</strong> {selectedPin.driver_name}</div>
              )}
              {selectedPin.vehicle_plate && (
                <div><strong>Vehicle:</strong> {selectedPin.vehicle_plate}</div>
              )}
            </div>

            <Button
              onClick={() => handleNavigateToLocation(selectedPin.coordinates)}
              className="w-full mt-4"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Job count indicator */}
      <div className="absolute bottom-4 left-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                {jobs?.length || 0} jobs on {selectedDate.toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobsMapView;