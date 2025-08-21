import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCurrentInventoryLocations } from '@/hooks/useCurrentInventoryLocations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Satellite, Map as MapIcon, X, Package } from 'lucide-react';

interface SimpleInventoryMapViewProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

export const SimpleInventoryMapView: React.FC<SimpleInventoryMapViewProps> = ({
  searchQuery = '',
  selectedLocationId = 'all',
  selectedProductType = 'all'
}) => {
  console.log('🟢 SIMPLE MAP VIEW: Component rendering');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch current deployed inventory data
  const { data: inventoryLocations = [], isLoading: dataLoading, error: dataError } = useCurrentInventoryLocations({
    searchQuery,
    selectedLocationId,
    selectedProductType
  });

  console.log('📊 Inventory locations:', inventoryLocations);

  // Calculate status counts for legend
  const statusCounts = inventoryLocations.reduce((counts, location) => {
    counts[location.status] = (counts[location.status] || 0) + location.quantity;
    return counts;
  }, {} as Record<string, number>);

  const totalInventory = inventoryLocations.reduce((total, location) => total + location.quantity, 0);

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
          console.log('🗺️ Mapbox token received');
        } else {
          const stored = localStorage.getItem('mapbox-token');
          if (stored) setMapboxToken(stored);
        }
      } catch (error) {
        console.error('🗺️ Token fetch error:', error);
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

    console.log('🗺️ Initializing Mapbox map...');
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/streets-v12',
      center: [-81.6944, 41.4993], // Cleveland, Ohio coordinates
      zoom: 9,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => {
      console.log('🗺️ Map loaded successfully!');
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapLoaded(false);
    };
  }, [mapboxToken]);

  // Update map style when changed
  useEffect(() => {
    if (map.current && mapboxToken) {
      const styleUrl = mapStyle === 'streets' 
        ? 'mapbox://styles/mapbox/streets-v12' 
        : 'mapbox://styles/mapbox/satellite-streets-v12';
      map.current.setStyle(styleUrl);
    }
  }, [mapStyle, mapboxToken]);

  // Create markers directly in component (proven approach)
  useEffect(() => {
    if (!map.current || !mapLoaded || !inventoryLocations.length) {
      console.log('📍 Markers: Waiting for map and data...', {
        hasMap: !!map.current,
        mapLoaded,
        locationsCount: inventoryLocations.length
      });
      return;
    }

    console.log('📍 Creating markers for', inventoryLocations.length, 'locations');

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const statusColors = {
      assigned: '#3b82f6',
      delivered: '#10b981', 
      in_service: '#f59e0b',
      maintenance: '#ef4444',
      available: '#6b7280'
    };

    // Calculate bounds for all locations
    const bounds = new mapboxgl.LngLatBounds();
    
    inventoryLocations.forEach((location, index) => {
      bounds.extend([location.longitude, location.latitude]);
      
      // Create marker element with STATIC approach (proven to work)
      const pinElement = document.createElement('div');
      pinElement.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${statusColors[location.status as keyof typeof statusColors] || statusColors.available};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        user-select: none;
      `;
      
      pinElement.textContent = location.quantity > 1 ? location.quantity.toString() : (index + 1).toString();
      
      // Add click handler with stopPropagation (proven pattern)
      pinElement.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedLocation(location);
      });

      // Create and add marker with static properties
      const marker = new mapboxgl.Marker({
        element: pinElement,
        anchor: 'center',
        draggable: false,
        rotation: 0,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers with padding
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { 
        padding: 80,
        maxZoom: 15
      });
    }

    console.log('📍 Created', markersRef.current.length, 'markers successfully');

  }, [map.current, mapLoaded, inventoryLocations]);

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    const colors = {
      assigned: '#3b82f6',
      delivered: '#10b981',
      in_service: '#f59e0b',
      maintenance: '#ef4444',
      available: '#6b7280'
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 h-[500px]">
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
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[500px]">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Legend - Top Left */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4" />
            <span className="text-sm font-medium">Current Deployed Inventory</span>
          </div>
          <div className="text-lg font-bold">{totalInventory} Units</div>
          
          <div className="mt-3 space-y-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center space-x-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="capitalize">{status}: {count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Map Style Controls */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-2">
          <div className="flex space-x-1">
            <Button
              variant={mapStyle === 'streets' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapStyle('streets')}
              className="flex items-center space-x-1"
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Streets</span>
            </Button>
            <Button
              variant={mapStyle === 'satellite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapStyle('satellite')}
              className="flex items-center space-x-1"
            >
              <Satellite className="h-4 w-4" />
              <span className="hidden sm:inline">Satellite</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Loading overlay */}
      {dataLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      )}

      {/* Popup for selected location */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 z-10 w-80">
          <Card className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{selectedLocation.product_name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLocation(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Customer:</span> {selectedLocation.customer_name}
              </div>
              <div>
                <span className="font-medium">Address:</span> {selectedLocation.customer_address}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className="px-2 py-1 rounded-full text-xs font-medium" 
                      style={{
                        backgroundColor: getStatusColor(selectedLocation.status) + '20',
                        color: getStatusColor(selectedLocation.status)
                      }}>
                  {selectedLocation.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {selectedLocation.quantity}
              </div>
              <div>
                <span className="font-medium">Job Type:</span> {selectedLocation.job_type}
              </div>
              <div>
                <span className="font-medium">Scheduled:</span> {selectedLocation.scheduled_date}
              </div>
              {selectedLocation.customer_phone && (
                <div>
                  <span className="font-medium">Phone:</span> {selectedLocation.customer_phone}
                </div>
                )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};