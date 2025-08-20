import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useJobs } from '@/hooks/useJobs';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Satellite, Map as MapIcon, Radar, Users, MapPin as MapPinIcon } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateForQuery } from '@/lib/dateUtils';
import { SimpleWeatherRadar, TimestampDisplay } from '@/components/jobs/SimpleWeatherRadar';




interface SimpleJobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  jobType?: string;
  status?: string;
  selectedDate: Date;
  isDriverMode: boolean;
  onMapModeChange: (isDriverMode: boolean) => void;
}

export function SimpleJobsMapView({ 
  searchTerm, 
  selectedDriver, 
  jobType, 
  status, 
  selectedDate,
  isDriverMode,
  onMapModeChange
}: SimpleJobsMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [selectedJobsAtLocation, setSelectedJobsAtLocation] = useState<any[]>([]);
  const [selectedJobForModal, setSelectedJobForModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [radarFrames, setRadarFrames] = useState<{ path: string; time: number }[]>([]);
  const [currentRadarFrame, setCurrentRadarFrame] = useState(0);
  
  // Check if selected date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const selectedDateIsToday = isToday(selectedDate);
  

  // Get jobs data
  const { data: allJobs = [] } = useJobs({
    date: formatDateForQuery(selectedDate),
    job_type: jobType !== 'all' ? jobType : undefined,
    status: status !== 'all' ? status : undefined,
    driver_id: selectedDriver !== 'all' ? selectedDriver : undefined
  });

  // Deduplicate jobs and prioritize entries with GPS coordinates
  const deduplicateJobs = (jobs: any[]) => {
    const jobMap = new Map();
    
    jobs.forEach(job => {
      const key = job.job_number || job.id;
      
      if (!jobMap.has(key)) {
        jobMap.set(key, job);
      } else {
        // Check if current job has better GPS coordinates than stored one
        const currentJob = jobMap.get(key);
        const currentHasGPS = hasValidGPS(currentJob);
        const newHasGPS = hasValidGPS(job);
        
        // Prioritize entry with GPS coordinates
        if (!currentHasGPS && newHasGPS) {
          jobMap.set(key, job);
        }
        // If both have GPS, prefer the default location
        else if (currentHasGPS && newHasGPS) {
          const currentDefaultLocation = currentJob.customers?.customer_service_locations?.find(loc => loc.is_default);
          const newDefaultLocation = job.customers?.customer_service_locations?.find(loc => loc.is_default);
          
          if (!currentDefaultLocation?.gps_coordinates && newDefaultLocation?.gps_coordinates) {
            jobMap.set(key, job);
          }
        }
      }
    });
    
    return Array.from(jobMap.values());
  };

  // Helper function to check if a job has valid GPS coordinates
  const hasValidGPS = (job: any) => {
    const serviceLocations = job.customers?.customer_service_locations;
    if (!serviceLocations || serviceLocations.length === 0) return false;
    
    // First try to find default location with GPS
    const defaultLocation = serviceLocations.find(loc => loc.is_default && loc.gps_coordinates);
    if (defaultLocation?.gps_coordinates) return true;
    
    // Then try any location with GPS
    const anyLocationWithGPS = serviceLocations.find(loc => loc.gps_coordinates);
    return !!anyLocationWithGPS?.gps_coordinates;
  };

  // Filter jobs based on search term
  const filterJobs = (jobs: any[]) => {
    return jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const deduplicatedJobs = deduplicateJobs(allJobs);
  const filteredJobs = filterJobs(deduplicatedJobs);

  // Auto-disable radar when date is not today
  useEffect(() => {
    if (!selectedDateIsToday && radarEnabled) {
      setRadarEnabled(false);
    }
  }, [selectedDate, selectedDateIsToday, radarEnabled]);


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
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/streets-v12',
      center: [-81.6944, 41.4993], // Cleveland, Ohio coordinates
      zoom: 9, // Zoom level to show Cleveland metro area
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // Add smooth zoom animation to Cleveland area with different behavior for driver vs standard mode
    setTimeout(() => {
      if (map.current) {
        if (isDriverMode) {
          // Driver mode: More focused zoom with faster animation
          map.current.flyTo({
            center: [-81.6944, 41.4993], // Cleveland, Ohio
            zoom: 11,
            duration: 1500, // 1.5 second animation
            curve: 1.2, // More aggressive curve
            easing: (t) => 1 - Math.pow(1 - t, 3) // Ease out cubic
          });
        } else {
          // Standard mode: Broader view with smooth animation
          map.current.flyTo({
            center: [-81.6944, 41.4993], // Cleveland, Ohio
            zoom: 10,
            duration: 2000, // 2 second animation
            curve: 1.42, // Smooth curve
            easing: (t) => t * (2 - t) // Ease out animation
          });
        }
      }
    }, 500); // Small delay to let map fully initialize

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, isDriverMode]);

  // Update map style when changed
  useEffect(() => {
    if (map.current && mapboxToken) {
      const styleUrl = mapStyle === 'streets' 
        ? 'mapbox://styles/mapbox/streets-v12' 
        : 'mapbox://styles/mapbox/satellite-streets-v12';
      map.current.setStyle(styleUrl);
      
    }
  }, [mapStyle, mapboxToken]);

  // Create static pins - simple approach
  useEffect(() => {
    if (!map.current || !filteredJobs.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoordinates = false;

    // Group jobs by customer GPS coordinates
    const jobsByLocation = new Map();
    const jobsWithoutLocation = [];
    
    filteredJobs.forEach(job => {
      // Get customer's service location GPS coordinates with smart selection
      const serviceLocations = job.customers?.customer_service_locations;
      let selectedLocation = null;
      
      if (serviceLocations && serviceLocations.length > 0) {
        // First try to find default location with GPS
        selectedLocation = serviceLocations.find(loc => loc.is_default && loc.gps_coordinates);
        
        // If no default with GPS, find any location with GPS
        if (!selectedLocation) {
          selectedLocation = serviceLocations.find(loc => loc.gps_coordinates);
        }
        
        // Fallback to default location (even without GPS)
        if (!selectedLocation) {
          selectedLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
        }
      }
      
      const gpsCoords = selectedLocation?.gps_coordinates;
      
      if (gpsCoords && typeof gpsCoords === 'string') {
        // Parse the POINT format: (longitude,latitude)
        const match = gpsCoords.match(/\(([^,]+),([^)]+)\)/);
        if (match) {
          const lng = parseFloat(match[1]);
          const lat = parseFloat(match[2]);
          
          if (!isNaN(lng) && !isNaN(lat)) {
            const key = `${lng},${lat}`;
            if (!jobsByLocation.has(key)) {
              jobsByLocation.set(key, []);
            }
            jobsByLocation.get(key).push(job);
          } else {
            jobsWithoutLocation.push({
              job_number: job.job_number,
              customer_name: job.customers?.name,
              address: job.customers?.service_street ? 
                `${job.customers.service_street}, ${job.customers.service_city}, ${job.customers.service_state}` : 
                'No address available',
              reason: 'Invalid GPS coordinates format'
            });
          }
        } else {
          jobsWithoutLocation.push({
            job_number: job.job_number,
            customer_name: job.customers?.name,
            address: job.customers?.service_street ? 
              `${job.customers.service_street}, ${job.customers.service_city}, ${job.customers.service_state}` : 
              'No address available',
            reason: 'GPS coordinates parsing failed'
          });
        }
      } else {
        jobsWithoutLocation.push({
          job_number: job.job_number,
          customer_name: job.customers?.name,
          address: job.customers?.service_street ? 
            `${job.customers.service_street}, ${job.customers.service_city}, ${job.customers.service_state}` : 
            'No address available',
          reason: 'No GPS coordinates available'
        });
      }
    });

    // Log jobs without coordinates for debugging
    if (jobsWithoutLocation.length > 0) {
      console.warn('Jobs without GPS coordinates:', jobsWithoutLocation);
    }

    // Create static pins for each location
    jobsByLocation.forEach((jobs, locationKey) => {
      // Parse coordinates from the key format "lng,lat"
      const [lng, lat] = locationKey.split(',').map(parseFloat);
      
      if (isNaN(lng) || isNaN(lat)) return;

      hasCoordinates = true;
      bounds.extend([lng, lat]);

      const firstJob = jobs[0];
      const count = jobs.length;

      // Create static pin element
      const pinElement = document.createElement('div');
      
      if (count === 1) {
        // Single job pin
        const jobTypeCode = firstJob.job_type.charAt(0).toUpperCase();
        const statusColor = getStatusColor(firstJob.status);
        
        pinElement.innerHTML = `
          <div style="
            width: 32px; 
            height: 32px; 
            background-color: ${statusColor}; 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 12px; 
            cursor: pointer; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          ">${jobTypeCode}</div>
        `;
      } else {
        // Multiple jobs cluster
        pinElement.innerHTML = `
          <div style="
            width: 36px; 
            height: 36px; 
            background-color: #374151; 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 13px; 
            cursor: pointer; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          ">${count}</div>
        `;
      }

      // Simple click handler
      pinElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (jobs.length === 1) {
          setSelectedJobForModal(jobs[0].id);
        } else {
          setSelectedJobsAtLocation(jobs);
        }
      });

      // Add marker
      const marker = new mapboxgl.Marker({
        element: pinElement,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds without auto-zoom animation
    if (hasCoordinates && jobsByLocation.size > 0) {
      setTimeout(() => {
        if (map.current) {
          // Only fit bounds if we have more than one location or this is the initial load
          const shouldFitBounds = jobsByLocation.size > 1 || markersRef.current.length === 0;
          
          if (shouldFitBounds) {
            map.current.fitBounds(bounds, { 
              padding: 50,
              duration: 0 // No animation
            });
          }
        }
      }, 100);
    }
  }, [filteredJobs, mapStyle]);

  const getStatusColor = (status: string) => {
    const colors = {
      assigned: '#3B82F6',    // blue-500
      in_progress: '#F59E0B', // amber-500  
      completed: '#10B981',   // emerald-500
      cancelled: '#EF4444',   // red-500
      unassigned: '#6B7280'   // gray-500
    };
    return colors[status] || '#6B7280';
  };

  const getJobTypeColor = (type: string) => {
    const colors = {
      delivery: 'bg-blue-500',
      pickup: 'bg-red-500', 
      service: 'bg-amber-500',
      'on-site-survey': 'bg-red-800',
      return: 'bg-green-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div>Loading map...</div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
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
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Control Panel - Top Left */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Map Style Toggle */}
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
        </div>


        {/* Map Status */}
        {filteredJobs.length > 0 && (
          <div className="bg-white px-3 py-2 rounded-lg shadow-lg border text-xs text-gray-600">
            Jobs for {format(selectedDate, 'MMM d, yyyy')}: {filteredJobs.length}
          </div>
        )}

        {/* Radar Toggle */}
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Weather Radar</span>
            <Switch
              checked={radarEnabled}
              onCheckedChange={(checked) => {
                if (selectedDateIsToday) {
                  setRadarEnabled(checked);
                }
              }}
              disabled={!selectedDateIsToday}
            />
          </div>
          {!selectedDateIsToday && (
            <div className="text-xs text-gray-500 mt-1">
              Radar only available for today's date
            </div>
          )}
        </div>
        
        {/* Weather Radar Timestamp Display */}
        {radarEnabled && selectedDateIsToday && radarFrames.length > 0 && (
          <div className="mt-2">
            <TimestampDisplay 
              frames={radarFrames} 
              currentFrame={currentRadarFrame} 
              isActive={radarEnabled} 
            />
          </div>
        )}

      </div>

      {/* Multiple Jobs Dialog */}
      <Dialog open={selectedJobsAtLocation.length > 0} onOpenChange={() => setSelectedJobsAtLocation([])}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Jobs at this Location
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedJobsAtLocation([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedJobsAtLocation.map((job) => (
              <div
                key={job.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedJobsAtLocation([]);
                  setSelectedJobForModal(job.id);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{job.job_number}</div>
                  <div className="flex gap-2">
                    <Badge className={getJobTypeColor(job.job_type) + " text-white"}>
                      {job.job_type}
                    </Badge>
                    <Badge className={getStatusBadgeColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {job.customers?.name}
      </div>

      {/* Weather Radar */}
      {map.current && radarEnabled && selectedDateIsToday && (
        <SimpleWeatherRadar 
          map={map.current} 
          enabled={radarEnabled}
          onFramesUpdate={(frames, currentFrame) => {
            setRadarFrames(frames);
            setCurrentRadarFrame(currentFrame);
          }}
        />
      )}
                {job.scheduled_time && (
                  <div className="text-sm text-gray-500">
                    {format(new Date(`2000-01-01T${job.scheduled_time}`), 'h:mm a')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Detail Modal */}
      {selectedJobForModal && (
        <JobDetailModal
          jobId={selectedJobForModal}
          open={!!selectedJobForModal}
          onOpenChange={(open) => {
            if (!open) setSelectedJobForModal(null);
          }}
        />
      )}
    </div>
  );
}