import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { formatDateForQuery } from '@/lib/dateUtils';

// Utility function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

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
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<any>(null);

  // Format date for jobs query using unified date
  const dateString = formatDateForQuery(selectedDate);

  // Get jobs data with proper "all" filter handling
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs({
    date: dateString,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    driver_id: selectedDriver === 'all' ? undefined : selectedDriver,
    job_type: selectedJobType === 'all' ? undefined : selectedJobType,
  });

  // Only log errors, remove verbose debugging in production
  if (jobsError) {
    console.error('JobsMapView: Jobs error:', jobsError);
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
        // Map loaded successfully
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      // Clear markers before removing map
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Add job pins to map
  useEffect(() => {
    if (!map.current || !map.current.loaded()) {
      return;
    }

    if (jobsLoading) {
      return;
    }

    if (jobsError) {
      console.error('Jobs error:', jobsError);
      return;
    }

    const managePins = async () => {
      try {
        // Clear existing markers properly
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // If no jobs, stop here (pins are cleared)
        if (!jobs || jobs.length === 0) {
          return;
        }

        // Get service locations for customers
        const customerIds = [...new Set(jobs.map(job => job.customer_id))];
        
        const { data: locations, error } = await supabase
          .from('customer_service_locations')
          .select('*')
          .in('customer_id', customerIds);

        if (error) {
          console.error('Error fetching service locations:', error);
          return;
        }


        let pinsAdded = 0;
        const bounds = new mapboxgl.LngLatBounds();

        // Create pins for jobs with locations
        jobs.forEach((job) => {
          // First try to get coordinates from job itself
          let coordinates: [number, number] | null = null;
          
          if (job.selected_coordinate_ids && Array.isArray(job.selected_coordinate_ids) && job.selected_coordinate_ids.length > 0) {
            // TODO: Fetch coordinates from service_location_coordinates table
            // For now, skip to default location
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
              }
            }
          }

          // If we still don't have coordinates, skip this job
          if (!coordinates && job.customers) {
            return;
          }

          if (coordinates) {
            const [lng, lat] = coordinates;
            
            // Job type colors
            const jobTypeColors: Record<string, string> = {
              'delivery': '#3b82f6', // Blue
              'pickup': '#10b981',   // Green
              'service': '#f59e0b',  // Orange
              'cleaning': '#8b5cf6', // Purple
              'return': '#ef4444',   // Red
            };

            // Create marker
            const marker = new mapboxgl.Marker({
              color: jobTypeColors[job.job_type] || '#6b7280'
            })
              .setLngLat([lng, lat])
              .addTo(map.current!);

            // Store marker reference for proper cleanup
            markersRef.current.push(marker);

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
          }
        });

        // Fit map to show all pins if we have any
        if (pinsAdded > 0 && !bounds.isEmpty()) {
          map.current?.fitBounds(bounds, { 
            padding: 50,
            maxZoom: 15 
          });
        }
      } catch (error) {
        console.error('Error managing job pins:', error);
      }
    };

    managePins();
  }, [jobs, dateString]); // Use serialized date string instead of Date object

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
              <div><strong>Type:</strong> {capitalizeWords(selectedPin.job_type)}</div>
              <div><strong>Status:</strong> {capitalizeWords(selectedPin.status)}</div>
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

      {/* Job Type Legend */}
      <Card className="absolute top-4 left-4">
        <CardContent className="p-3">
          <h4 className="font-semibold text-sm mb-2">Job Types</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Pickup</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Service</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Cleaning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Return</span>
            </div>
          </div>
        </CardContent>
      </Card>

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