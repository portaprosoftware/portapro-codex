import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  jobType?: string;
  status?: string;
  selectedDate: Date;
}

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  customer_id: string;
  driver_id?: string;
  vehicle_id?: string;
  gps_coordinates?: [number, number];
  customers?: {
    id: string;
    name: string;
  };
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  vehicles?: {
    id: string;
    license_plate: string;
  };
}

interface ServiceLocation {
  id: string;
  customer_id: string;
  gps_coordinates?: unknown;
}

const JobsMapPage: React.FC<JobsMapViewProps> = ({
  searchTerm,
  selectedDriver,
  jobType,
  status,
  selectedDate
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [selectedPin, setSelectedPin] = useState<Job | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          const storedToken = localStorage.getItem('mapbox-token');
          if (storedToken) {
            setMapboxToken(storedToken);
          }
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        const storedToken = localStorage.getItem('mapbox-token');
        if (storedToken) {
          setMapboxToken(storedToken);
        }
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    setIsLoadingMap(true);
    
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoadingMap(false);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Fetch jobs data
  useEffect(() => {
    const fetchJobs = async () => {
      if (!selectedDate) return;

      setIsLoadingJobs(true);
      
      try {
        const dateString = selectedDate.toISOString().split('T')[0];
        
        let query = supabase
          .from('jobs')
          .select(`
            *,
            customers!inner(*),
            profiles(*),
            vehicles(*)
          `)
          .eq('scheduled_date', dateString);

        if (searchTerm) {
          query = query.or(`job_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`);
        }

        if (selectedDriver && selectedDriver !== 'all') {
          query = query.eq('driver_id', selectedDriver);
        }

        if (jobType && jobType !== 'all') {
          query = query.eq('job_type', jobType);
        }

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data: jobsData, error: jobsError } = await query;

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError);
          return;
        }

        setJobs(jobsData || []);

        // Fetch service locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('customer_service_locations')
          .select('*');

        if (!locationsError) {
          setServiceLocations(locationsData || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [selectedDate, searchTerm, selectedDriver, jobType, status]);

  // Create map pins
  useEffect(() => {
    if (!map.current || !jobs.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const coordinates: [number, number][] = [];

    jobs.forEach(job => {
      let jobCoordinates: [number, number] | null = null;

      // Use job's GPS coordinates if available
      if (job.gps_coordinates && Array.isArray(job.gps_coordinates) && job.gps_coordinates.length === 2) {
        jobCoordinates = [job.gps_coordinates[1], job.gps_coordinates[0]]; // [lng, lat]
      } else {
        // Find customer's default service location
        const serviceLocation = serviceLocations.find(loc => 
          loc.customer_id === job.customer_id && 
          loc.gps_coordinates && 
          Array.isArray(loc.gps_coordinates) && 
          loc.gps_coordinates.length === 2
        );
        
        if (serviceLocation?.gps_coordinates) {
          jobCoordinates = [serviceLocation.gps_coordinates[1], serviceLocation.gps_coordinates[0]]; // [lng, lat]
        }
      }

      if (!jobCoordinates) return;

      coordinates.push(jobCoordinates);

      // Get pin color based on job type
      const getPinColor = (type: string) => {
        switch (type) {
          case 'delivery': return '#3B82F6';
          case 'pickup': return '#EF4444';
          case 'service': return '#F59E0B';
          case 'return': return '#10B981';
          default: return '#6B7280';
        }
      };

      // Get job type code
      const getJobTypeCode = (type: string) => {
        switch (type) {
          case 'delivery': return 'D';
          case 'pickup': return 'P';
          case 'service': return 'S';
          case 'return': return 'R';
          default: return 'J';
        }
      };

      const pinColor = getPinColor(job.job_type);
      const jobTypeCode = getJobTypeCode(job.job_type);

      // Create pin element with inline styles (your exact pattern)
      const pinElement = document.createElement('div');
      pinElement.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          background-color: ${pinColor};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${jobTypeCode}</div>
      `;

      // Add click handler
      pinElement.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPin(job);
      });

      // Create and add marker
      const marker = new mapboxgl.Marker(pinElement)
        .setLngLat(jobCoordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all pins
    if (coordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [jobs, serviceLocations]);

  const handleTokenSubmit = (token: string) => {
    localStorage.setItem('mapbox-token', token);
    setMapboxToken(token);
  };

  const handleNavigateToLocation = (coordinates: [number, number]) => {
    const [lng, lat] = coordinates;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (isLoadingToken) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading Mapbox token...</div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-lg font-semibold">Mapbox Token Required</div>
        <div className="text-sm text-muted-foreground text-center max-w-md">
          Please enter your Mapbox public token to display the map.
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter Mapbox token..."
            className="px-3 py-2 border rounded-md"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTokenSubmit((e.target as HTMLInputElement).value);
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              handleTokenSubmit(input.value);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96">
      {isLoadingMap && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-lg">Loading map...</div>
        </div>
      )}
      
      {isLoadingJobs && (
        <div className="absolute top-4 left-4 bg-background/90 px-3 py-1 rounded-md shadow z-10">
          <div className="text-sm">Loading jobs...</div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {selectedPin && (
        <Card className="absolute top-4 right-4 p-4 max-w-sm z-10">
          <div className="space-y-2">
            <div className="font-semibold">{selectedPin.job_number}</div>
            <div className="text-sm text-muted-foreground">
              Type: {selectedPin.job_type} | Status: {selectedPin.status}
            </div>
            <div className="text-sm">
              Customer: {selectedPin.customers?.name}
            </div>
            {selectedPin.profiles && (
              <div className="text-sm">
                Driver: {selectedPin.profiles.first_name} {selectedPin.profiles.last_name}
              </div>
            )}
            {selectedPin.vehicles && (
              <div className="text-sm">
                Vehicle: {selectedPin.vehicles.license_plate}
              </div>
            )}
            {selectedPin.gps_coordinates && (
              <button
                onClick={() => handleNavigateToLocation([
                  selectedPin.gps_coordinates![1],
                  selectedPin.gps_coordinates![0]
                ])}
                className="w-full px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
              >
                Navigate
              </button>
            )}
            <button
              onClick={() => setSelectedPin(null)}
              className="w-full px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
            >
              Close
            </button>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-3 rounded-md shadow z-10">
        <div className="text-sm font-semibold mb-2">Job Types</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div style={{ width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '50%' }}></div>
            <span>Delivery (D)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div style={{ width: '12px', height: '12px', backgroundColor: '#EF4444', borderRadius: '50%' }}></div>
            <span>Pickup (P)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div style={{ width: '12px', height: '12px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></div>
            <span>Service (S)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div style={{ width: '12px', height: '12px', backgroundColor: '#10B981', borderRadius: '50%' }}></div>
            <span>Return (R)</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Jobs for {selectedDate.toLocaleDateString()}: {jobs.length}
        </div>
      </div>
    </div>
  );
};

export default JobsMapPage;