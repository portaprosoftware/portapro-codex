import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  RefreshCw, 
  Navigation, 
  Phone,
  X,
  Calendar,
  Clock,
  User,
  Truck
} from 'lucide-react';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  currentDate: Date;
}

const statusColors = {
  'scheduled': '#3b82f6',
  'assigned': '#eab308', 
  'en_route': '#f97316',
  'in_progress': '#8b5cf6',
  'completed': '#22c55e',
  'cancelled': '#ef4444'
};

const statusLabels = {
  'scheduled': 'Scheduled',
  'assigned': 'Assigned',
  'en_route': 'En Route', 
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
};

const jobTypeLetters = {
  'delivery': 'D',
  'pickup': 'P', 
  'service': 'S',
  'return': 'R'
};

const formatDateForQuery = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};

const JobsMapView: React.FC<JobsMapViewProps> = ({
  searchTerm = '',
  selectedDriver = 'all',
  selectedJobType = 'all',
  selectedStatus = 'all',
  currentDate
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  // Get job data with GPS coordinates
  const { data: jobs = [], isLoading } = useJobs({
    date: formatDateForQuery(currentDate),
    job_type: selectedJobType !== 'all' ? selectedJobType : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    driver_id: selectedDriver !== 'all' ? selectedDriver : undefined
  });

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
          localStorage.setItem('mapbox_token', data.token);
        } else {
          // Try localStorage first
          const saved = localStorage.getItem('mapbox_token');
          if (saved) {
            setMapboxToken(saved);
          } else {
            setShowTokenInput(true);
          }
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        // Try localStorage as fallback
        const saved = localStorage.getItem('mapbox_token');
        if (saved) {
          setMapboxToken(saved);
        } else {
          setShowTokenInput(true);
        }
      }
    };
    
    fetchMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-81.7, 41.5], // Ohio center
      zoom: 8
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('style.load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Load job pins when map and data are ready
  useEffect(() => {
    if (mapLoaded && map.current?.isStyleLoaded() && jobs.length > 0) {
      loadJobPins();
    }
  }, [mapLoaded, jobs]);

  const loadJobPins = async () => {
    if (!map.current || !mapLoaded) return;

    console.log('Loading job pins for', jobs.length, 'jobs');

    // Clear existing sources
    if (map.current.getSource('jobs')) {
      map.current.removeLayer('jobs-layer');
      map.current.removeSource('jobs');
    }

    // Get customer IDs from jobs
    const customerIds = [...new Set(jobs.map(job => job.customer_id).filter(Boolean))];
    
    if (customerIds.length === 0) return;

    // Fetch service locations
    const { data: serviceLocations, error } = await supabase
      .from('customer_service_locations')
      .select('customer_id, gps_coordinates, is_default, location_name')
      .in('customer_id', customerIds);

    if (error) {
      console.error('Error fetching service locations:', error);
      return;
    }

    // Create job features with coordinates
    const features = jobs
      .map(job => {
        // Get GPS coordinates from customer service locations
        const customerServiceLocations = serviceLocations?.filter(
          loc => loc.customer_id === job.customer_id
        ) || [];
        const defaultLocation = customerServiceLocations.find(loc => loc.is_default && loc.gps_coordinates);
        const anyLocationWithGPS = customerServiceLocations.find(loc => loc.gps_coordinates);
        const location = defaultLocation || anyLocationWithGPS;
        
        if (!location?.gps_coordinates) {
          console.log('No GPS coordinates for job', job.job_number);
          return null;
        }
        
        // Parse GPS coordinates from PostgreSQL point format
        const coordString = String(location.gps_coordinates);
        const coordMatch = coordString.match(/\(([^,]+),([^)]+)\)/);
        if (!coordMatch) {
          console.log('Failed to parse coordinates:', coordString);
          return null;
        }
        
        const lng = parseFloat(coordMatch[1]);
        const lat = parseFloat(coordMatch[2]);
        
        if (isNaN(lng) || isNaN(lat)) {
          console.log('Invalid coordinates:', coordMatch);
          return null;
        }

        console.log('Adding pin for job', job.job_number, 'at', [lng, lat]);

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat]
          },
          properties: {
            id: job.id,
            job_number: job.job_number,
            job_type: job.job_type,
            status: job.status,
            customer_name: job.customers?.name || 'Unknown',
            scheduled_date: job.scheduled_date,
            scheduled_time: job.scheduled_time,
            driver_name: job.profiles ? `${job.profiles.first_name} ${job.profiles.last_name}` : 'Unassigned',
            vehicle_info: job.vehicles ? `${job.vehicles.license_plate} (${job.vehicles.vehicle_type})` : 'No vehicle'
          }
        };
      })
      .filter(Boolean);

    console.log('Created', features.length, 'valid features');

    if (features.length === 0) {
      console.log('No features to display');
      return;
    }

    // Add source and layer
    map.current.addSource('jobs', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });

    map.current.addLayer({
      id: 'jobs-layer',
      type: 'circle',
      source: 'jobs',
      paint: {
        'circle-radius': 10,
        'circle-color': [
          'case',
          ['==', ['get', 'status'], 'scheduled'], statusColors.scheduled,
          ['==', ['get', 'status'], 'assigned'], statusColors.assigned,
          ['==', ['get', 'status'], 'en_route'], statusColors.en_route,
          ['==', ['get', 'status'], 'in_progress'], statusColors.in_progress,
          ['==', ['get', 'status'], 'completed'], statusColors.completed,
          ['==', ['get', 'status'], 'cancelled'], statusColors.cancelled,
          '#666666'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click event
    map.current.on('click', 'jobs-layer', (e) => {
      if (e.features && e.features[0]) {
        setSelectedPin(e.features[0].properties);
      }
    });

    // Auto-fit to show all pins
    const bounds = new mapboxgl.LngLatBounds();
    features.forEach(feature => {
      if (feature && feature.geometry && feature.geometry.coordinates) {
        bounds.extend([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]);
      }
    });
    
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      localStorage.setItem('mapbox_token', tokenInput.trim());
      setShowTokenInput(false);
    }
  };

  const handleNavigateToLocation = async (pin: any) => {
    const job = jobs.find(j => j.id === pin.id);
    if (!job) return;

    // Fetch service locations for this customer
    const { data: serviceLocations } = await supabase
      .from('customer_service_locations')
      .select('customer_id, gps_coordinates, is_default, location_name')
      .eq('customer_id', job.customer_id);
    
    const location = serviceLocations?.find(loc => loc.is_default && loc.gps_coordinates) || 
                    serviceLocations?.find(loc => loc.gps_coordinates);
    
    if (location?.gps_coordinates) {
      const coordString = String(location.gps_coordinates);
      const coordMatch = coordString.match(/\(([^,]+),([^)]+)\)/);
      if (coordMatch) {
        const lng = parseFloat(coordMatch[1]);
        const lat = parseFloat(coordMatch[2]);
        const address = `${lat},${lng}`;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
      }
    }
  };

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mapbox Token Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              To display the map, please enter your Mapbox public token. You can get one from{' '}
              <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                mapbox.com
              </a>
            </p>
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            <Button onClick={handleTokenSubmit} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p>Setting up map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Date indicator */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-3">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{format(currentDate, 'MMMM d, yyyy')}</span>
          </div>
        </Card>
      </div>

      {/* Job counts */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = jobs.filter(job => job.status === status).length;
            if (count === 0) return null;
            
            return (
              <Badge
                key={status}
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: statusColors[status as keyof typeof statusColors], color: 'white' }}
              >
                {label}: {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Selected pin details */}
      {selectedPin && (
        <Card className="absolute bottom-4 left-4 z-10 w-80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Job #{selectedPin.job_number}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPin(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: statusColors[selectedPin.status as keyof typeof statusColors], color: 'white' }}
                >
                  {statusLabels[selectedPin.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {jobTypeLetters[selectedPin.job_type as keyof typeof jobTypeLetters]}
                </span>
                <span className="text-xs capitalize">{selectedPin.job_type}</span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{selectedPin.customer_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{selectedPin.scheduled_date}</span>
                <Clock className="h-4 w-4 text-gray-500 ml-2" />
                <span>{selectedPin.scheduled_time}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{selectedPin.driver_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <span>{selectedPin.vehicle_info}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleNavigateToLocation(selectedPin)}
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Navigate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 right-4 z-10 p-3">
        <div className="space-y-2">
          <div className="font-medium text-sm">Job Types</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(jobTypeLetters).map(([type, letter]) => (
              <div key={type} className="flex items-center gap-1">
                <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-medium">
                  {letter}
                </span>
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
          
          <div className="font-medium text-sm pt-2">Status Colors</div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{statusLabels[status as keyof typeof statusLabels]}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JobsMapView;