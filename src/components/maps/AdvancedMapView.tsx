import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Route, 
  Zap, 
  Eye, 
  EyeOff, 
  Settings, 
  Layers,
  Clock,
  AlertTriangle,
  RefreshCw,
  Phone,
  MessageSquare
} from 'lucide-react';

// For demo purposes, using a public Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1haS1kZW1vIiwiYSI6ImNseXFjZm83ejEyMGcya3F5YWJwa29wZ2MifQ.jqTCZzTueBu4oKq4s8Hf8Q';

interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  type: 'job' | 'driver' | 'vehicle';
  status: string;
  title: string;
  subtitle?: string;
  metadata?: any;
}

interface RouteOptimization {
  waypoints: [number, number][];
  duration: number;
  distance: number;
  efficiency_score: number;
}

export const AdvancedMapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteOptimization | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [realTimeTracking, setRealTimeTracking] = useState(true);

  // Fetch map locations (jobs, drivers, vehicles)
  const { data: locations, refetch: refetchLocations } = useQuery({
    queryKey: ['map-locations'],
    queryFn: async (): Promise<MapLocation[]> => {
      const locations: MapLocation[] = [];

      // Fetch jobs with locations
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          *,
          customers:customer_id (name, service_street, service_city, service_state),
          profiles:driver_id (first_name, last_name)
        `)
        .in('status', ['assigned', 'in_progress']);

      if (jobs) {
        jobs.forEach(job => {
          // For demo, using random coordinates around Pittsburgh
          const lat = 40.4406 + (Math.random() - 0.5) * 0.1;
          const lng = -79.9959 + (Math.random() - 0.5) * 0.1;
          
          locations.push({
            id: job.id,
            latitude: lat,
            longitude: lng,
            type: 'job',
            status: job.status,
            title: `${job.job_type} - ${job.customers?.name}`,
            subtitle: job.profiles ? `Driver: ${job.profiles.first_name} ${job.profiles.last_name}` : 'Unassigned',
            metadata: job
          });
        });
      }

      // Fetch driver locations (simulated)
      const { data: drivers } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      if (drivers) {
        drivers.forEach(driver => {
          const lat = 40.4406 + (Math.random() - 0.5) * 0.2;
          const lng = -79.9959 + (Math.random() - 0.5) * 0.2;
          
          locations.push({
            id: driver.id,
            latitude: lat,
            longitude: lng,
            type: 'driver',
            status: 'active',
            title: `${driver.first_name} ${driver.last_name}`,
            subtitle: 'Driver',
            metadata: driver
          });
        });
      }

      return locations;
    },
    refetchInterval: realTimeTracking ? 30000 : false
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(mapStyle),
      center: [-79.9959, 40.4406], // Pittsburgh coordinates
      zoom: 11
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocation control
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      loadMapFeatures();
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(getMapStyle(mapStyle));
      map.current.once('styledata', () => {
        loadMapFeatures();
      });
    }
  }, [mapStyle, mapLoaded]);

  // Update traffic layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (showTraffic) {
      map.current.addLayer({
        id: 'traffic',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        },
        'source-layer': 'traffic',
        paint: {
          'line-width': 2,
          'line-color': [
            'case',
            ['==', ['get', 'congestion'], 'low'], '#3fb34f',
            ['==', ['get', 'congestion'], 'moderate'], '#ff8c00',
            ['==', ['get', 'congestion'], 'heavy'], '#ff0000',
            '#ff0000'
          ]
        }
      });
    } else {
      if (map.current.getLayer('traffic')) {
        map.current.removeLayer('traffic');
      }
    }
  }, [showTraffic, mapLoaded]);

  // Update locations on map
  useEffect(() => {
    if (mapLoaded && locations) {
      updateMapLocations();
    }
  }, [locations, mapLoaded]);

  const getMapStyle = (style: string) => {
    switch (style) {
      case 'satellite':
        return 'mapbox://styles/mapbox/satellite-v9';
      case 'terrain':
        return 'mapbox://styles/mapbox/outdoors-v12';
      default:
        return 'mapbox://styles/mapbox/streets-v12';
    }
  };

  const loadMapFeatures = () => {
    if (!map.current) return;

    // Add geofences (example zones)
    if (showGeofences) {
      addGeofences();
    }

    // Update locations
    if (locations) {
      updateMapLocations();
    }
  };

  const addGeofences = () => {
    if (!map.current) return;

    // Example service areas/geofences
    const geofences = [
      {
        id: 'service-area-1',
        coordinates: [
          [-80.1, 40.5],
          [-79.8, 40.5],
          [-79.8, 40.3],
          [-80.1, 40.3],
          [-80.1, 40.5]
        ],
        name: 'Primary Service Area'
      },
      {
        id: 'service-area-2',
        coordinates: [
          [-80.2, 40.7],
          [-79.7, 40.7],
          [-79.7, 40.5],
          [-80.2, 40.5],
          [-80.2, 40.7]
        ],
        name: 'Extended Service Area'
      }
    ];

    map.current.addSource('geofences', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geofences.map(fence => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [fence.coordinates]
          },
          properties: {
            id: fence.id,
            name: fence.name
          }
        }))
      }
    });

    map.current.addLayer({
      id: 'geofences-fill',
      type: 'fill',
      source: 'geofences',
      paint: {
        'fill-color': '#007cbf',
        'fill-opacity': 0.1
      }
    });

    map.current.addLayer({
      id: 'geofences-line',
      type: 'line',
      source: 'geofences',
      paint: {
        'line-color': '#007cbf',
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });
  };

  const updateMapLocations = () => {
    if (!map.current || !locations) return;

    // Clear existing sources
    if (map.current.getSource('locations')) {
      map.current.removeLayer('locations');
      map.current.removeSource('locations');
    }

    const features = locations.map(location => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      properties: {
        ...location,
        icon: getLocationIcon(location.type, location.status)
      }
    }));

    map.current.addSource('locations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features as any
      }
    });

    // Add location markers
    map.current.addLayer({
      id: 'locations',
      type: 'circle',
      source: 'locations',
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'type'], 'driver'], 8,
          ['==', ['get', 'type'], 'vehicle'], 10,
          6
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'type'], 'driver'], '#4F46E5',
          ['==', ['get', 'type'], 'vehicle'], '#059669',
          ['==', ['get', 'status'], 'assigned'], '#3B82F6',
          ['==', ['get', 'status'], 'in_progress'], '#F59E0B',
          ['==', ['get', 'status'], 'completed'], '#10B981',
          '#6B7280'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click handler
    map.current.on('click', 'locations', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        setSelectedLocation(feature.properties as MapLocation);
        
        // Center map on clicked location
        map.current?.flyTo({
          center: [feature.properties.longitude, feature.properties.latitude],
          zoom: 14
        });
      }
    });

    // Add hover cursor
    map.current.on('mouseenter', 'locations', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'locations', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  };

  const getLocationIcon = (type: string, status: string) => {
    if (type === 'driver') return 'user';
    if (type === 'vehicle') return 'truck';
    return status === 'completed' ? 'check' : status === 'in_progress' ? 'clock' : 'circle';
  };

  const optimizeRoute = async () => {
    if (!locations) return;

    setIsOptimizing(true);
    try {
      // Simulate route optimization
      const jobLocations = locations.filter(l => l.type === 'job' && l.status !== 'completed');
      
      if (jobLocations.length < 2) {
        toast.error('Need at least 2 jobs to optimize route');
        return;
      }

      // Mock optimization result
      const mockRoute: RouteOptimization = {
        waypoints: jobLocations.map(loc => [loc.longitude, loc.latitude] as [number, number]),
        duration: Math.floor(Math.random() * 300 + 120), // 2-7 hours
        distance: Math.floor(Math.random() * 200 + 50), // 50-250 miles
        efficiency_score: Math.floor(Math.random() * 30 + 70) // 70-100%
      };

      setOptimizedRoute(mockRoute);
      
      // Draw route on map
      if (map.current) {
        // In a real implementation, you'd use Mapbox Directions API
        const routeGeoJSON = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: mockRoute.waypoints
          }
        };

        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(routeGeoJSON as any);
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: routeGeoJSON as any
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            paint: {
              'line-color': '#3B82F6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }
      }

      toast.success('Route optimized successfully!');
    } catch (error) {
      toast.error('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  const clearRoute = () => {
    if (map.current && map.current.getLayer('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    setOptimizedRoute(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Map View</h2>
          <p className="text-muted-foreground">Real-time tracking and route optimization</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={realTimeTracking}
              onCheckedChange={setRealTimeTracking}
            />
            <span className="text-sm">Real-time</span>
          </div>
          
          <Button onClick={() => refetchLocations()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="relative">
              <div ref={mapContainer} className="h-[600px] w-full" />
              
              {/* Map Controls Overlay */}
              <div className="absolute top-4 left-4 space-y-2">
                <Card className="p-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={showTraffic}
                        onCheckedChange={setShowTraffic}
                      />
                      <span className="text-xs">Traffic</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={showGeofences}
                        onCheckedChange={setShowGeofences}
                      />
                      <span className="text-xs">Service Areas</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={showRoutes}
                        onCheckedChange={setShowRoutes}
                      />
                      <span className="text-xs">Routes</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-2">
                  <select 
                    value={mapStyle}
                    onChange={(e) => setMapStyle(e.target.value as any)}
                    className="text-xs border-none bg-transparent"
                  >
                    <option value="streets">Streets</option>
                    <option value="satellite">Satellite</option>
                    <option value="terrain">Terrain</option>
                  </select>
                </Card>
              </div>

              {/* Route Optimization Controls */}
              <div className="absolute bottom-4 left-4">
                <Card className="p-3">
                  <div className="space-y-2">
                    <Button 
                      onClick={optimizeRoute}
                      disabled={isOptimizing}
                      size="sm"
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                    </Button>
                    
                    {optimizedRoute && (
                      <Button 
                        onClick={clearRoute}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Clear Route
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              {/* Route Info */}
              {optimizedRoute && (
                <div className="absolute bottom-4 right-4">
                  <Card className="p-3">
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">Optimized Route</div>
                      <div>Duration: {Math.floor(optimizedRoute.duration / 60)}h {optimizedRoute.duration % 60}m</div>
                      <div>Distance: {optimizedRoute.distance} miles</div>
                      <div>Efficiency: {optimizedRoute.efficiency_score}%</div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Location Details */}
          {selectedLocation ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge className={`
                    ${selectedLocation.type === 'job' && selectedLocation.status === 'assigned' ? 'bg-blue-500' : ''}
                    ${selectedLocation.type === 'job' && selectedLocation.status === 'in_progress' ? 'bg-orange-500' : ''}
                    ${selectedLocation.type === 'job' && selectedLocation.status === 'completed' ? 'bg-green-500' : ''}
                    ${selectedLocation.type === 'driver' ? 'bg-purple-500' : ''}
                    ${selectedLocation.type === 'vehicle' ? 'bg-emerald-500' : ''}
                  `}>
                    {selectedLocation.type} - {selectedLocation.status}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium">{selectedLocation.title}</h4>
                  {selectedLocation.subtitle && (
                    <p className="text-sm text-gray-600">{selectedLocation.subtitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                  
                  {selectedLocation.type === 'job' && (
                    <>
                      <Button variant="outline" className="w-full" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Customer
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Update
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-500">Select a Location</h3>
                <p className="text-sm text-gray-400">Click on any marker to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Map Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Assigned Jobs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-sm">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Drivers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                <span className="text-sm">Vehicles</span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Active Jobs</span>
                <span className="font-medium">
                  {locations?.filter(l => l.type === 'job' && l.status !== 'completed').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Drivers Online</span>
                <span className="font-medium">
                  {locations?.filter(l => l.type === 'driver').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Vehicles Active</span>
                <span className="font-medium">
                  {locations?.filter(l => l.type === 'vehicle').length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};