import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  currentDate: Date;
}

const JobsMapView: React.FC<JobsMapViewProps> = ({
  searchTerm,
  selectedDriver,
  selectedJobType,
  selectedStatus,
  currentDate,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<any>(null);

  // Format date for jobs query
  const dateString = currentDate.toISOString().split('T')[0];

  // Get jobs data
  const { data: jobs, isLoading: jobsLoading } = useJobs({
    date: dateString,
    status: selectedStatus,
    driver_id: selectedDriver,
    job_type: selectedJobType,
  });

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

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-84.6229, 41.0846], // ABC Carnival coordinates
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Add job pins to map
  useEffect(() => {
    if (!map.current || !jobs || jobs.length === 0) return;

    const addPins = async () => {
      try {
        // Get service locations for customers
        const customerIds = jobs.map(job => job.customer_id);
        const { data: locations } = await supabase
          .from('customer_service_locations')
          .select('*')
          .in('customer_id', customerIds);

        console.log('Jobs:', jobs);
        console.log('Service locations:', locations);

        // Create pins for jobs with locations
        jobs.forEach((job) => {
          const location = locations?.find(loc => 
            loc.customer_id === job.customer_id && loc.is_default
          );

          if (location?.gps_coordinates) {
            // Parse GPS coordinates
            const coords = String(location.gps_coordinates).match(/\(([^)]+)\)/)?.[1];
            if (coords) {
              const [lng, lat] = coords.split(',').map(Number);
              
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

              // Add click handler
              marker.getElement().addEventListener('click', () => {
                setSelectedPin({
                  ...job,
                  coordinates: [lng, lat],
                  locationName: location.location_name,
                });
              });

              console.log(`Added pin for job ${job.job_number} at [${lng}, ${lat}]`);
            }
          }
        });

        // Fit map to show all pins if we have locations
        if (locations && locations.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          locations.forEach(location => {
            if (location.gps_coordinates) {
              const coords = String(location.gps_coordinates).match(/\(([^)]+)\)/)?.[1];
              if (coords) {
                const [lng, lat] = coords.split(',').map(Number);
                bounds.extend([lng, lat]);
              }
            }
          });
          
          if (!bounds.isEmpty()) {
            map.current?.fitBounds(bounds, { padding: 50 });
          }
        }
      } catch (error) {
        console.error('Error adding job pins:', error);
      }
    };

    addPins();
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
    <div className="relative h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
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
              <div><strong>Customer:</strong> {selectedPin.customers?.name}</div>
              <div><strong>Type:</strong> {selectedPin.job_type}</div>
              <div><strong>Status:</strong> {selectedPin.status}</div>
              <div><strong>Location:</strong> {selectedPin.locationName}</div>
              {selectedPin.drivers && (
                <div><strong>Driver:</strong> {selectedPin.drivers.first_name} {selectedPin.drivers.last_name}</div>
              )}
              {selectedPin.vehicles && (
                <div><strong>Vehicle:</strong> {selectedPin.vehicles.license_plate}</div>
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
      <div className="absolute top-4 left-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                {jobs?.length || 0} jobs on {currentDate.toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobsMapView;