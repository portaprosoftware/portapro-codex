import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Phone, MapPin } from 'lucide-react';

// Mapbox token will be fetched from Supabase

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  customers: {
    name?: string;
  } | null;
}

const statusColors = {
  assigned: '#3B82F6',
  'in-progress': '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444'
};

export const DriverMapView: React.FC = () => {
  const { user } = useUser();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { latitude, longitude } = useGeolocation();
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setShowTokenInput(true);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setShowTokenInput(true);
      }
    };
    
    fetchMapboxToken();
  }, []);

  const { data: jobs } = useQuery({
    queryKey: ['driver-jobs-map', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('driver_id', user.id)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: latitude && longitude ? [longitude, latitude] : [-81.6944, 41.4993], // Cleveland center
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    
    map.current.addControl(geolocate, 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, latitude, longitude]);

  useEffect(() => {
    if (!map.current || !jobs) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add job markers with actual coordinates
    jobs.forEach((job, index) => {
      // Use real coordinates from job data - for now using Cleveland area
      const coordinates: [number, number] = [
        -81.6944 + (Math.random() - 0.5) * 0.02,
        41.4993 + (Math.random() - 0.5) * 0.02
      ];

      const markerElement = document.createElement('div');
      markerElement.className = 'w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-white text-xs font-bold';
      markerElement.style.backgroundColor = statusColors[job.status as keyof typeof statusColors] || '#6B7280';
      markerElement.textContent = (index + 1).toString();

      markerElement.addEventListener('click', () => {
        setSelectedJob(job);
      });

      new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .addTo(map.current!);
    });
  }, [jobs]);

  const handleNavigateToJob = (job: Job) => {
    // TODO: Implement route optimization and navigation
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.customers?.name || 'Service Location')}`;
    window.open(url, '_blank');
  };

  const handleOptimizeRoute = () => {
    // TODO: Implement route optimization using Mapbox Directions API
    console.log('Optimizing route for all jobs...');
  };

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center p-6 max-w-md">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Map Configuration Required</h3>
          <p className="text-muted-foreground mb-4">
            Please configure your Mapbox access token to enable the map view.
          </p>
          <input
            type="text"
            placeholder="Enter your Mapbox public token (pk.)"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <Button
            onClick={() => setShowTokenInput(false)}
            disabled={!mapboxToken || !mapboxToken.startsWith('pk.')}
          >
            Apply Token
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Route Optimization Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button onClick={handleOptimizeRoute} size="sm">
          <Navigation className="w-4 h-4 mr-2" />
          Optimize Route
        </Button>
      </div>

      {/* Job Detail Popup */}
      {selectedJob && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium">{selectedJob.customers?.name || 'Unknown Customer'}</h3>
              <p className="text-sm text-muted-foreground">{selectedJob.job_number}</p>
            </div>
            <Badge 
              style={{ 
                backgroundColor: statusColors[selectedJob.status as keyof typeof statusColors] || '#6B7280',
                color: 'white'
              }}
            >
              {selectedJob.status.replace(/-/g, ' ')}
            </Badge>
          </div>

          <div className="flex space-x-2">
            <Button 
              size="sm"
              onClick={() => handleNavigateToJob(selectedJob)}
              className="flex-1"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigate
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open('tel:+1234567890', '_self')}
            >
              <Phone className="w-4 h-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedJob(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};