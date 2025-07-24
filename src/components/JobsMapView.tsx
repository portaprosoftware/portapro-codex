import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  CloudRain,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Eye,
  Play,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';

// Mock data for demonstration
const mockJobs = [
  {
    id: 'DEL-824',
    customerId: 123,
    customerName: 'Hickory Hollow Farm',
    jobType: 'Delivery',
    status: 'assigned',
    driverId: 1,
    scheduledDate: new Date(2025, 6, 20), // Make overdue
    driverName: 'Grady Green',
    location: { lat: 40.4406, lng: -79.9959 },
    address: '123 Farm Road, Butler, PA'
  },
  {
    id: 'SVC-941',
    customerId: 124,
    customerName: 'BlueWave Festival',
    jobType: 'Service',
    status: 'in_progress',
    driverId: 2,
    scheduledDate: new Date(2025, 6, 22),
    driverName: 'Jason Wells',
    location: { lat: 40.4173, lng: -79.9428 },
    address: '456 Festival Grounds, Pittsburgh, PA'
  },
  {
    id: 'PKP-122',
    customerId: 125,
    customerName: 'Mountain View Resort',
    jobType: 'Pickup',
    status: 'completed',
    driverId: 1,
    scheduledDate: new Date(2025, 6, 22),
    driverName: 'Grady Green',
    location: { lat: 40.3868, lng: -79.8963 },
    address: '789 Resort Lane, Mt. Lebanon, PA'
  },
  {
    id: 'CAN-555',
    customerId: 126,
    customerName: 'City Park Event',
    jobType: 'Delivery',
    status: 'cancelled',
    driverId: 2,
    scheduledDate: new Date(2025, 6, 22),
    driverName: 'Jason Wells',
    location: { lat: 40.4044, lng: -79.9514 },
    address: '321 Park Avenue, Pittsburgh, PA'
  },
  {
    id: 'LTE-333',
    customerId: 127,
    customerName: 'Corporate Campus',
    jobType: 'Service',
    status: 'completed',
    driverId: 1,
    scheduledDate: new Date(2025, 6, 21), // Will be marked as completed late
    driverName: 'Grady Green',
    location: { lat: 40.4361, lng: -79.9481 },
    address: '555 Corporate Drive, Pittsburgh, PA'
  }
];

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

const JobsMapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 22));
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [viewMode, setViewMode] = useState<'status' | 'driver'>('status');
  const [weatherRadar, setWeatherRadar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [weatherApiKey, setWeatherApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

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
      center: [-79.9959, 40.4406],
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setMapLoaded(true);
      loadPins();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (mapLoaded) {
      loadPins();
    }
  }, [viewMode, mapLoaded, selectedDriver]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (weatherRadar) {
      if (!weatherApiKey && !showApiKeyInput) {
        setShowApiKeyInput(true);
        return;
      }
      
      if (weatherApiKey) {
        addWeatherOverlay();
      }
    } else {
      removeWeatherOverlay();
    }
  }, [weatherRadar, weatherApiKey, mapLoaded]);

  const addWeatherOverlay = () => {
    if (!map.current) return;

    if (!map.current.getSource('weather')) {
      map.current.addSource('weather', {
        type: 'raster',
        tiles: [
          `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${weatherApiKey}`
        ],
        tileSize: 256
      });

      map.current.addLayer({
        id: 'weather',
        type: 'raster',
        source: 'weather',
        paint: {
          'raster-opacity': 0.6
        }
      });
    }
  };

  const removeWeatherOverlay = () => {
    if (!map.current) return;

    if (map.current.getLayer('weather')) {
      map.current.removeLayer('weather');
    }
    if (map.current.getSource('weather')) {
      map.current.removeSource('weather');
    }
  };

  const loadPins = () => {
    if (!map.current) return;

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
    if (!map.current) return;

    const filteredJobs = selectedDriver === 'all' 
      ? mockJobs 
      : mockJobs.filter(job => job.driverId.toString() === selectedDriver);

    const features = filteredJobs.map(job => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [job.location.lng, job.location.lat]
      },
      properties: {
        id: job.id,
        status: job.status,
        jobType: job.jobType,
        customerName: job.customerName,
        driverName: job.driverName,
        address: job.address
      }
    }));

    map.current.addSource('jobs', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features as any
      }
    });

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
    if (!map.current) return;

    const filteredDrivers = selectedDriver === 'all' 
      ? mockDrivers 
      : mockDrivers.filter(driver => driver.id.toString() === selectedDriver);

    const features = filteredDrivers.map(driver => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [driver.location.lng, driver.location.lat]
      },
      properties: {
        id: driver.id,
        name: driver.name,
        avatar: driver.avatar,
        status: driver.status,
        jobCount: driver.jobCount
      }
    }));

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


  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
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

  // Calculate stats with overdue and completed_late logic
  const totalJobs = mockJobs.length;
  const completedJobs = mockJobs.filter(job => job.status === 'completed').length;
  const inProgressJobs = mockJobs.filter(job => job.status === 'in_progress').length;
  const assignedJobs = mockJobs.filter(job => job.status === 'assigned').length;
  const cancelledJobs = mockJobs.filter(job => job.status === 'cancelled').length;
  const overdueJobs = mockJobs.filter(job => {
    const currentDate = new Date();
    const scheduledDate = new Date(job.scheduledDate);
    scheduledDate.setHours(23, 59, 59, 999);
    return (job.status === 'assigned' || job.status === 'in_progress') && scheduledDate < currentDate;
  }).length;
  const completedLateJobs = mockJobs.filter(job => {
    if (job.status !== 'completed') return false;
    // For demo purposes, assume some completed jobs were late
    return Math.random() > 0.7; // Randomly mark ~30% as late for demo
  }).length;
  const totalDrivers = mockDrivers.length;

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Date Navigation */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10"
                onClick={goToPreviousDay}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" className="px-4 rounded-full">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(currentDate, 'MMMM do, yyyy')}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10"
                onClick={goToNextDay}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Driver Filter */}
            <select 
              className="rounded-full border border-gray-300 px-4 py-2 bg-white min-w-32"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="all">All Drivers</option>
              <option value="1">Grady Green</option>
              <option value="2">Jason Wells</option>
            </select>

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
              disabled={isRefreshing}
              className="border-[#3366FF] text-[#3366FF] hover:bg-blue-50 rounded-full"
            >
              <RotateCcw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="flex items-center space-x-3 flex-wrap">
        <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1 rounded-full font-bold">
          Total Jobs: {totalJobs}
        </Badge>
        <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1 rounded-full font-bold">
          Total Drivers on Map Today: {totalDrivers}
        </Badge>
        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full font-bold">
          Completed: {completedJobs}
        </Badge>
        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full font-bold">
          In Progress: {inProgressJobs}
        </Badge>
        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full font-bold">
          Assigned: {assignedJobs}
        </Badge>
        {overdueJobs > 0 && (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full font-bold">
            Overdue: {overdueJobs}
          </Badge>
        )}
        {cancelledJobs > 0 && (
          <Badge className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-3 py-1 rounded-full font-bold">
            Cancelled: {cancelledJobs}
          </Badge>
        )}
        {completedLateJobs > 0 && (
          <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded-full font-bold">
            Completed Late: {completedLateJobs}
          </Badge>
        )}
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-96 lg:h-[600px]"
        />
        
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

      {/* OpenWeather API Key Input Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">OpenWeather API Key Required</h3>
            <p className="text-gray-600 mb-4">
              To enable weather radar, please enter your OpenWeather API key. 
              You can get one free at <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-[#3366FF] underline">openweathermap.org</a>.
            </p>
            <Input
              type="text"
              placeholder="Enter your OpenWeather API key"
              value={weatherApiKey}
              onChange={(e) => setWeatherApiKey(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApiKeyInput(false);
                  setWeatherRadar(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowApiKeyInput(false);
                  if (weatherApiKey) {
                    addWeatherOverlay();
                  }
                }}
                disabled={!weatherApiKey}
                className="flex-1 bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

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
