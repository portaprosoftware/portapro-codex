import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Phone, MapPin, Clock, Calendar } from 'lucide-react';
import { formatDateSafe } from '@/lib/dateUtils';

// TODO: Replace with actual Mapbox token
const MAPBOX_ACCESS_TOKEN = 'pk.YOUR_MAPBOX_TOKEN_HERE';

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

  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['driver-jobs-map', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0];
      
      // First, try to find jobs directly with Clerk user ID
      let { data, error } = await supabase
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

      // If no jobs found, try to find jobs through profiles table
      if (!error && (!data || data.length === 0)) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', user.id)
          .maybeSingle();

        if (!profileError && profileData) {
          const result = await supabase
            .from('jobs')
            .select(`
              *,
              customers (
                name
              )
            `)
            .eq('driver_id', profileData.id)
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true });
          
          data = result.data;
          error = result.error;
        }
      }

      if (error) throw error;
      return (data || []) as Job[];
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: latitude && longitude ? [longitude, latitude] : [-74.006, 40.7128],
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
  }, [latitude, longitude]);

  useEffect(() => {
    if (!map.current || !jobs) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add job markers
    jobs.forEach((job, index) => {
      // TODO: Replace with actual coordinates from job data
      const coordinates: [number, number] = [
        -74.006 + (Math.random() - 0.5) * 0.02,
        40.7128 + (Math.random() - 0.5) * 0.02
      ];

      const markerElement = document.createElement('div');
      markerElement.className = 'w-10 h-10 rounded-full border-3 border-white shadow-lg cursor-pointer flex items-center justify-center text-white text-xs font-bold relative';
      markerElement.style.backgroundColor = statusColors[job.status as keyof typeof statusColors] || '#6B7280';
      
      // Add job type indicator
      const typeIndicator = document.createElement('div');
      typeIndicator.className = 'absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold';
      typeIndicator.style.color = statusColors[job.status as keyof typeof statusColors] || '#6B7280';
      typeIndicator.textContent = job.job_type.charAt(0).toUpperCase();
      markerElement.appendChild(typeIndicator);
      
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
    // Launch external mapping app with coordinates
    const destination = `${job.customers?.name || 'Service Location'}`;
    
    // Try to launch native apps first, then fallback to web
    const iosUrl = `maps://?daddr=${encodeURIComponent(destination)}`;
    const androidUrl = `geo:0,0?q=${encodeURIComponent(destination)}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    
    // Detect platform and use appropriate URL
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      window.location.href = iosUrl;
      // Fallback to web if Maps app not installed
      setTimeout(() => window.open(webUrl, '_blank'), 1000);
    } else if (/Android/.test(navigator.userAgent)) {
      window.location.href = androidUrl;
      setTimeout(() => window.open(webUrl, '_blank'), 1000);
    } else {
      window.open(webUrl, '_blank');
    }
  };

  const handleOptimizeRoute = () => {
    // TODO: Implement route optimization using Mapbox Directions API
    console.log('Optimizing route for all jobs...');
  };

  // Loading state
  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (jobsError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Jobs</h3>
          <p className="text-muted-foreground mb-4">
            {jobsError.message || 'Failed to load jobs for map view'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No Mapbox token
  if (!MAPBOX_ACCESS_TOKEN.includes('pk.')) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Map Configuration Required</h3>
          <p className="text-muted-foreground mb-4">
            Please configure your Mapbox access token to enable the map view.
          </p>
          {jobs && jobs.length > 0 && (
            <div className="mt-4 p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                You have {jobs.length} job{jobs.length === 1 ? '' : 's'} assigned:
              </p>
              <div className="space-y-2">
                {jobs.slice(0, 3).map(job => (
                  <div key={job.id} className="text-sm">
                    <span className="font-medium">{job.customers?.name || 'Unknown Customer'}</span>
                    <span className="text-muted-foreground"> - {job.job_type}</span>
                  </div>
                ))}
                {jobs.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{jobs.length - 3} more job{jobs.length - 3 === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          )}
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
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedJob.customers?.name || 'Unknown Customer'}</h3>
              <p className="text-sm text-gray-600">{selectedJob.job_number}</p>
              
              {/* Job Type and Time Window */}
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-gradient-blue text-white text-xs px-2 py-1">
                  {selectedJob.job_type}
                </Badge>
                {selectedJob.scheduled_time && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedJob.scheduled_time}
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDateSafe(selectedJob.scheduled_date, 'short')}
              </div>
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
              className="flex-1 bg-gradient-primary text-white"
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