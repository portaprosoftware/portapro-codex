import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SimpleInventoryMapViewProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

export const SimpleInventoryMapView: React.FC<SimpleInventoryMapViewProps> = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set the Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoicG9ydGFwcm9zb2Z0d2FyZSIsImEiOiJjbWJybnBnMnIwY2x2Mm1wd3p2MWdqY2FnIn0.7ZIJ7ufeGtn-ufiOGJpq1Q';

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-95.7129, 37.0902], // Center of US
      zoom: 4
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full min-h-[400px] rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};