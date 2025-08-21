import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCurrentInventoryLocations } from '@/hooks/useCurrentInventoryLocations';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, Satellite } from 'lucide-react';

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

  // Create markers directly in component (simplified approach)
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
      
      // Create marker element
      const el = document.createElement('div');
      el.style.cssText = `
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
      
      el.textContent = location.quantity > 1 ? location.quantity.toString() : (index + 1).toString();
      
      // Add click handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedLocation(location);
      });

      // Create and add marker
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 15
      });
    }

    console.log('📍 Created', markersRef.current.length, 'markers successfully');

  }, [map.current, mapLoaded, inventoryLocations]);

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
    <div className="relative w-full h-[600px]">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
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

        {/* Inventory Status */}
        {inventoryLocations.length > 0 && (
          <div className="bg-white px-3 py-2 rounded-lg shadow-lg border text-xs text-gray-600">
            Current Deployed Inventory: {inventoryLocations.length} locations
          </div>
        )}

        {/* Loading indicator */}
        {dataLoading && (
          <div className="bg-white px-3 py-2 rounded-lg shadow-lg border text-xs text-gray-600">
            Loading current inventory...
          </div>
        )}
      </div>

      {/* Location Detail Popup */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-sm">{selectedLocation.customer_name}</h3>
            <button 
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Product:</strong> {selectedLocation.product_name}</div>
            <div><strong>Item Code:</strong> {selectedLocation.item_code}</div>
            <div><strong>Status:</strong> {selectedLocation.status}</div>
            <div><strong>Quantity:</strong> {selectedLocation.quantity}</div>
            <div><strong>Address:</strong> {selectedLocation.customer_address}</div>
            <div><strong>Job Type:</strong> {selectedLocation.job_type}</div>
            <div><strong>Deployed:</strong> {new Date(selectedLocation.scheduled_date).toLocaleDateString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};