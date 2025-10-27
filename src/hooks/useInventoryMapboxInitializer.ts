import { useEffect, useRef, useState } from 'react';
import { loadMapboxLibs } from '@/lib/loaders/map';

export interface MapboxState {
  map: any | null;
  mapContainer: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: string | null;
  mapboxToken: string;
  showTokenInput: boolean;
  mapboxgl: any | null;
}

export const useInventoryMapboxInitializer = (): MapboxState => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any | null>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use the public Mapbox token directly
  const mapboxToken = 'pk.eyJ1IjoicG9ydGFwcm9zb2Z0d2FyZSIsImEiOiJjbWJybnBnMnIwY2x2Mm1wd3p2MWdqY2FnIn0.7ZIJ7ufeGtn-ufiOGJpq1Q';
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Load Mapbox library
  useEffect(() => {
    loadMapboxLibs()
      .then(setMapboxgl)
      .catch((err) => {
        console.error('Failed to load Mapbox:', err);
        setError('Failed to load map library');
        setIsLoading(false);
      });
  }, []);

  // Initialize map when library and token are available
  useEffect(() => {
    console.log('🗺️ useInventoryMapboxInitializer: Map initialization effect triggered');
    console.log('🗺️ useInventoryMapboxInitializer: State check:', {
      hasContainer: !!mapContainer.current,
      hasToken: !!mapboxToken,
      hasMapboxgl: !!mapboxgl,
      showTokenInput,
      tokenLength: mapboxToken?.length,
      containerElement: mapContainer.current
    });

    if (!mapContainer.current) {
      console.log('🗺️ useInventoryMapboxInitializer: No map container, waiting...');
      setIsLoading(false);
      return;
    }

    if (!mapboxgl) {
      console.log('🗺️ useInventoryMapboxInitializer: Mapbox library not loaded yet, waiting...');
      setIsLoading(true);
      return;
    }

    if (showTokenInput) {
      console.log('🗺️ useInventoryMapboxInitializer: Token input shown, skipping initialization');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🗺️ useInventoryMapboxInitializer: Mapbox already configured via loader');

      console.log('🗺️ useInventoryMapboxInitializer: Creating new Mapbox map...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-95.7129, 37.0902], // Center of US
        zoom: 4
      });

      console.log('🗺️ useInventoryMapboxInitializer: Map created, adding controls...');
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('🗺️ useInventoryMapboxInitializer: Map loaded successfully!');
        setIsLoading(false);
      });

      map.current.on('error', (e) => {
        console.error('🗺️ useInventoryMapboxInitializer: Map error:', e);
        setError('Failed to load map: ' + e.error?.message || 'Unknown error');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('🗺️ useInventoryMapboxInitializer: Map initialization error:', err);
      setError('Failed to initialize map: ' + err.message);
      setIsLoading(false);
    }

    return () => {
      console.log('🗺️ useInventoryMapboxInitializer: Cleaning up map...');
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxgl, mapboxToken, showTokenInput]);

  return {
    map: map.current,
    mapContainer,
    isLoading,
    error,
    mapboxToken,
    showTokenInput,
    mapboxgl
  };
};