import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { 
  CloudRain,
  RotateCcw,
  Crosshair,
  X,
  Eye,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';
import { SimpleWeatherRadar } from '@/components/jobs/SimpleWeatherRadar';
import { useJobs } from '@/hooks/useJobs';
import { formatDateForQuery } from '@/lib/dateUtils';

const mockDrivers = [
  {
    id: 1,
    name: 'Grady Green',
    avatar: 'GG',
    status: 'active',
    location: { lat: 40.4406, lng: -79.9959 },
    jobCount: 2
  },
  {
    id: 2,
    name: 'Jason Wells',
    avatar: 'JW',
    status: 'active',
    location: { lat: 40.4173, lng: -79.9428 },
    jobCount: 1
  }
];

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  currentDate?: Date;
}

const statusColors = {
  assigned: '#3B82F6',    // Blue
  in_progress: '#F97316', // Orange  
  completed: '#10B981',   // Green
  completed_late: '#6B7280', // Gray
  cancelled: '#1F2937',   // Dark gray/black for cancelled
  overdue: '#EF4444'      // Red
};

const statusLabels = {
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  completed_late: 'Job Completed Late',
  cancelled: 'Cancelled',
  overdue: 'Overdue'
};

const jobTypeLetters = {
  delivery: 'D',
  pickup: 'P', 
  service: 'S',
  return: 'R',
  cleaning: 'C',
  maintenance: 'M',
  inspection: 'I'
};

const driverColors = {
  'Jason Wells': '#3B82F6',    // Blue
  'Grady Green': '#EF4444',    // Red
  'Kygo Jones': '#10B981',     // Green
  'Unassigned': '#6B7280'      // Gray
};

const JobsMapView: React.FC<JobsMapViewProps> = ({ 
  searchTerm = '', 
  selectedDriver = 'all', 
  selectedJobType = 'all', 
  selectedStatus = 'all',
  currentDate = new Date()
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [viewMode, setViewMode] = useState<'status' | 'driver'>('status');
  const [weatherRadar, setWeatherRadar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Get real job data using the same hook as other views
  const { data: jobs = [], isLoading } = useJobs({
    date: formatDateForQuery(currentDate),
    job_type: selectedJobType !== 'all' ? selectedJobType : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    driver_id: selectedDriver !== 'all' ? selectedDriver : undefined
  });

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

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-79.9959, 40.4406], // Will be updated when jobs load
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('style.load', () => {
      console.log('Map style loaded');
      setMapLoaded(true);
      loadPins();
    });

    map.current.on('styledata', () => {
      // Style data loaded, safe to add sources/layers
      if (map.current?.isStyleLoaded()) {
        console.log('Map style data loaded and ready');
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (mapLoaded && map.current?.isStyleLoaded()) {
      loadPins();
    }
  }, [viewMode, mapLoaded, selectedDriver, jobs]);


  const loadPins = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready for loading pins');
      return;
    }

    console.log('Loading pins in', viewMode, 'mode');

    // Clear existing sources and layers
    if (map.current.getSource('jobs')) {
      map.current.removeLayer('jobs');
      map.current.removeSource('jobs');
    }
    if (map.current.getSource('drivers')) {
      map.current.removeLayer('drivers');
      map.current.removeSource('drivers');
    }

    if (viewMode === 'status') {
      loadJobPins();
    } else {
      loadDriverPins();
    }
  };

  const loadJobPins = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready for job pins');
      return;
    }

    // Filter jobs based on search term and current filters
    const filteredJobs = jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDriver = selectedDriver === 'all' || job.driver_id === selectedDriver;
      
      return matchesSearch && matchesDriver;
    });

    // Create features for jobs that have GPS coordinates
    const features = filteredJobs
      .filter(job => {
        // Check if customer has GPS coordinates in service locations
        const serviceLocations = job.customers?.customer_service_locations;
        const hasGPSCoordinates = Array.isArray(serviceLocations) && serviceLocations.some(
          (location: any) => location.gps_coordinates
        );
        return hasGPSCoordinates;
      })
      .map(job => {
        // Get the first service location with GPS coordinates (prefer default)
        const serviceLocations = job.customers?.customer_service_locations || [];
        const safeServiceLocations = Array.isArray(serviceLocations) ? serviceLocations : [];
        const defaultLocation = safeServiceLocations.find((loc: any) => loc.is_default && loc.gps_coordinates);
        const firstLocationWithGPS = safeServiceLocations.find((loc: any) => loc.gps_coordinates);
        const selectedLocation = defaultLocation || firstLocationWithGPS;
        
        if (!selectedLocation?.gps_coordinates) return null;
        
        // Parse GPS coordinates from format "(-81.83824,41.36749)" to [lng, lat]
        const coordMatch = selectedLocation.gps_coordinates.match(/\(([^,]+),([^)]+)\)/);
        if (!coordMatch) return null;
        
        const lng = parseFloat(coordMatch[1]);
        const lat = parseFloat(coordMatch[2]);
        
        if (isNaN(lng) || isNaN(lat)) return null;
        
        const address = `${job.customers?.service_street || ''} ${job.customers?.service_city || ''} ${job.customers?.service_state || ''}`.trim();
        
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            id: job.id,
            status: job.status,
            jobType: job.job_type,
            jobNumber: job.job_number,
            customerName: job.customers?.name || 'Unknown Customer',
            driverName: job.profiles?.first_name && job.profiles?.last_name 
              ? `${job.profiles.first_name} ${job.profiles.last_name}` 
              : 'Unassigned',
            address,
            scheduledTime: job.scheduled_time,
            scheduledDate: job.scheduled_date
          }
        };
      })
      .filter(Boolean);

    map.current.addSource('jobs', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features as any
      }
    });

    // Auto-center map on job locations if we have pins
    if (features.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach((feature: any) => {
        bounds.extend(feature.geometry.coordinates);
      });
      
      // Fit map to show all job pins with padding
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }

    map.current.addLayer({
      id: 'jobs',
      type: 'circle',
      source: 'jobs',
      paint: {
        'circle-radius': 12,
        'circle-color': [
          'case',
          ['==', ['get', 'status'], 'assigned'], statusColors.assigned,
          ['==', ['get', 'status'], 'in_progress'], statusColors.in_progress,
          ['==', ['get', 'status'], 'completed'], statusColors.completed,
          ['==', ['get', 'status'], 'completed_late'], statusColors.completed_late,
          ['==', ['get', 'status'], 'cancelled'], statusColors.cancelled,
          ['==', ['get', 'status'], 'overdue'], statusColors.overdue,
          '#666666'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    map.current.on('click', 'jobs', (e) => {
      if (e.features && e.features[0] && e.features[0].geometry.type === 'Point') {
        setSelectedPin({
          type: 'job',
          data: e.features[0].properties,
          coordinates: (e.features[0].geometry as any).coordinates
        });
      }
    });

    map.current.on('mouseenter', 'jobs', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'jobs', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });
  };

  const loadDriverPins = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready for driver pins');
      return;
    }

    // For driver view, group jobs by driver and show driver locations
    // This is a simplified implementation - in a real app you'd get actual driver locations
    const driverJobs = jobs.reduce((acc, job) => {
      if (job.driver_id && job.profiles) {
        const driverName = `${job.profiles.first_name} ${job.profiles.last_name}`;
        if (!acc[job.driver_id]) {
          acc[job.driver_id] = {
            id: job.driver_id,
            name: driverName,
            jobs: [],
            // Use mock location based on customer address
            location: job.customers?.service_street ? '40.4406,-79.9959' : null
          };
        }
        acc[job.driver_id].jobs.push(job);
      }
      return acc;
    }, {} as Record<string, any>);

    const features = Object.values(driverJobs)
      .filter((driver: any) => driver.location)
      .map((driver: any) => {
        const [lng, lat] = driver.location.split(',').map(Number);
        if (isNaN(lng) || isNaN(lat)) return null;

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            id: driver.id,
            name: driver.name,
            status: 'active',
            jobCount: driver.jobs.length
          }
        };
      })
      .filter(Boolean);

    map.current.addSource('drivers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features as any
      }
    });

    map.current.addLayer({
      id: 'drivers',
      type: 'circle',
      source: 'drivers',
      paint: {
        'circle-radius': 15,
        'circle-color': '#4A90E2',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    map.current.on('click', 'drivers', (e) => {
      if (e.features && e.features[0] && e.features[0].geometry.type === 'Point') {
        setSelectedPin({
          type: 'driver',
          data: e.features[0].properties,
          coordinates: (e.features[0].geometry as any).coordinates
        });
      }
    });

    map.current.on('mouseenter', 'drivers', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'drivers', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });
  };



  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      loadPins();
    }, 1500);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation && map.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Calculate stats from real job data
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const inProgressJobs = jobs.filter(job => job.status === 'in_progress').length;
  const assignedJobs = jobs.filter(job => job.status === 'assigned').length;
  const cancelledJobs = jobs.filter(job => job.status === 'cancelled').length;
  const overdueJobs = jobs.filter(job => {
    const currentDateTime = new Date();
    const scheduledDate = new Date(job.scheduled_date);
    scheduledDate.setHours(23, 59, 59, 999);
    return (job.status === 'assigned' || job.status === 'in_progress') && scheduledDate < currentDateTime;
  }).length;
  
  // Get unique drivers from current jobs
  const uniqueDrivers = new Set(jobs.filter(job => job.driver_id).map(job => job.driver_id));
  const totalDrivers = uniqueDrivers.size;

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Current Date Display */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Showing jobs for:</span>
              <Badge variant="outline" className="px-3 py-1">
                {format(currentDate, 'MMMM do, yyyy')}
              </Badge>
            </div>

            {/* View Toggle */}
            <div className="flex space-x-1 bg-gray-100 rounded-full p-1">
              <Button 
                variant={viewMode === 'status' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full px-4 h-8",
                  viewMode === 'status' && "bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white shadow-none"
                )}
                onClick={() => setViewMode('status')}
              >
                Status View
              </Button>
              
              <Button 
                variant={viewMode === 'driver' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full px-4 h-8",
                  viewMode === 'driver' && "bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white shadow-none"
                )}
                onClick={() => setViewMode('driver')}
              >
                Driver View
              </Button>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Weather Radar Toggle */}
            <div className="flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Weather Radar</span>
              <Switch 
                checked={weatherRadar} 
                onCheckedChange={setWeatherRadar}
              />
            </div>

            {/* Refresh Button */}
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="border-[#3366FF] text-[#3366FF] hover:bg-blue-50 rounded-full"
            >
              <RotateCcw className={cn("w-4 h-4 mr-2", (isRefreshing || isLoading) && "animate-spin")} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="space-y-3">
        {/* Total Badges - Always Visible */}
        <div className="flex items-center space-x-3 flex-wrap">
          <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1 rounded-full font-bold">
            Total Jobs: {totalJobs}
          </Badge>
          <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1 rounded-full font-bold">
            Total Drivers on Map Today: {totalDrivers}
          </Badge>
        </div>

        {/* Status Count Badges - Only Show if Count >= 1 */}
        <div className="flex items-center space-x-3 flex-wrap">
          {assignedJobs > 0 && (
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full font-bold">
              Assigned: {assignedJobs}
            </Badge>
          )}
          {inProgressJobs > 0 && (
            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full font-bold">
              In Progress: {inProgressJobs}
            </Badge>
          )}
          {completedJobs > 0 && (
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full font-bold">
              Completed: {completedJobs}
            </Badge>
          )}
          {cancelledJobs > 0 && (
            <Badge className="bg-gradient-to-r from-black to-gray-800 text-white px-3 py-1 rounded-full font-bold">
              Cancelled: {cancelledJobs}
            </Badge>
          )}
          {overdueJobs > 0 && (
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full font-bold">
              Overdue: {overdueJobs}
            </Badge>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-96 lg:h-[600px]"
        />
        
        {/* Weather Radar Component - only load when map is fully ready */}
        {map.current && mapLoaded && (
          <SimpleWeatherRadar 
            map={map.current} 
            isActive={weatherRadar} 
          />
        )}
        
        {/* Locate Me Button */}
        <div className="absolute bottom-6 left-6">
          <Button 
            variant="outline"
            size="icon"
            className="bg-white hover:bg-gray-50 shadow-md rounded-full h-12 w-12"
            onClick={handleLocateMe}
          >
            <Crosshair className="w-5 h-5" />
          </Button>
        </div>

        {/* Pin Popup */}
        {selectedPin && (
          <div className="absolute top-6 right-6 bg-white rounded-xl shadow-lg p-4 max-w-xs border">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                {selectedPin.type === 'job' ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{selectedPin.data.id}</span>
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const mockJob = {
                            id: selectedPin.data.id,
                            status: selectedPin.data.status,
                            scheduled_date: new Date().toISOString(),
                            actual_completion_time: selectedPin.data.status === 'completed' ? new Date().toISOString() : undefined
                          };
                          const statusInfo = getDualJobStatusInfo(mockJob);
                          
                          return (
                            <>
                              <Badge className={cn("text-white text-xs", statusInfo.primary.gradient)}>
                                {statusInfo.primary.label}
                              </Badge>
                              {statusInfo.secondary && (
                                <Badge className={cn("text-white text-xs", statusInfo.secondary.gradient)}>
                                  {statusInfo.secondary.label}
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{selectedPin.data.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedPin.data.jobType}</p>
                    <p className="text-sm text-gray-500">Driver: {selectedPin.data.driverName}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-[#3366FF] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {selectedPin.data.avatar}
                      </div>
                      <span className="font-semibold text-gray-900">{selectedPin.data.name}</span>
                    </div>
                    <p className="text-sm text-gray-500">{selectedPin.data.jobCount} jobs assigned</p>
                  </>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedPin(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-full">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              {selectedPin.type === 'job' && selectedPin.data.status !== 'completed' && (
                <Button 
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white rounded-full"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Job Type Letters */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Job Type Letters</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>D=Delivery, P=Pickup, S=Service, R=Return, C=Cleaning, M=Maintenance, I=Inspection</div>
            </div>
          </div>
          
          {/* Status/Driver Colors */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              {viewMode === 'status' ? 'Job Status Colors' : 'Driver Colors'}
            </h4>
            <div className="flex flex-wrap gap-3">
              {viewMode === 'status' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: statusColors.assigned}}></div>
                    <span className="text-sm text-gray-600">Assigned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: statusColors.in_progress}}></div>
                    <span className="text-sm text-gray-600">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: statusColors.completed}}></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: statusColors.completed_late}}></div>
                    <span className="text-sm text-gray-600">Job Completed Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: statusColors.cancelled}}></div>
                    <span className="text-sm text-gray-600">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: statusColors.overdue}}></div>
                    <span className="text-sm text-gray-600">Overdue</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: driverColors['Jason Wells']}}></div>
                    <span className="text-sm text-gray-600">Jason Wells</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: driverColors['Grady Green']}}></div>
                    <span className="text-sm text-gray-600">Grady Green</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: driverColors['Kygo Jones']}}></div>
                    <span className="text-sm text-gray-600">Kygo Jones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: driverColors['Unassigned']}}></div>
                    <span className="text-sm text-gray-600">Unassigned</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Mapbox Token Input Modal */}
      {showTokenInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Mapbox Token Required</h3>
            <p className="text-gray-600 mb-4">
              To display the map, please enter your Mapbox public token. 
              You can find it at <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-[#3366FF] underline">your Mapbox account</a>.
            </p>
            <Input
              type="text"
              placeholder="Enter your Mapbox public token (pk.)"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTokenInput(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowTokenInput(false);
                  // Token will be used to initialize map
                }}
                disabled={!mapboxToken || !mapboxToken.startsWith('pk.')}
                className="flex-1 bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsMapView;
