import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';

export interface MapboxState {
  map: mapboxgl.Map | null;
  mapContainer: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: string | null;
  mapboxToken: string;
  showTokenInput: boolean;
}

export const useInventoryMapboxInitializer = (): MapboxState => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Fetch Mapbox token
  useEffect(() => {
    console.log('🗺️ useInventoryMapboxInitializer: Starting token fetch...');
    const fetchMapboxToken = async () => {
      try {
        console.log('🗺️ useInventoryMapboxInitializer: Calling supabase.functions.invoke...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        console.log('🗺️ useInventoryMapboxInitializer: Token response:', { data, error });
        
        if (error) {
          console.error('🗺️ useInventoryMapboxInitializer: Token error:', error);
          throw error;
        }
        
        if (data?.token) {
          console.log('🗺️ useInventoryMapboxInitializer: Token received, length:', data.token.length);
          setMapboxToken(data.token);
        } else {
          console.log('🗺️ useInventoryMapboxInitializer: No token in response, showing input');
          setShowTokenInput(true);
        }
      } catch (error) {
        console.error('🗺️ useInventoryMapboxInitializer: Error fetching Mapbox token:', error);
        setError('Failed to fetch Mapbox token: ' + error.message);
        setShowTokenInput(true);
      }
    };
    
    fetchMapboxToken();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    console.log('🗺️ useInventoryMapboxInitializer: Map initialization effect triggered');
    console.log('🗺️ useInventoryMapboxInitializer: State check:', {
      hasContainer: !!mapContainer.current,
      hasToken: !!mapboxToken,
      showTokenInput,
      tokenLength: mapboxToken?.length,
      containerElement: mapContainer.current
    });

    if (!mapContainer.current) {
      console.log('🗺️ useInventoryMapboxInitializer: No map container, waiting...');
      setIsLoading(false);
      return;
    }

    if (!mapboxToken) {
      console.log('🗺️ useInventoryMapboxInitializer: No mapbox token, waiting...');
      setIsLoading(false);
      return;
    }

    if (showTokenInput) {
      console.log('🗺️ useInventoryMapboxInitializer: Token input shown, skipping initialization');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🗺️ useInventoryMapboxInitializer: Setting mapbox access token...');
      mapboxgl.accessToken = mapboxToken;

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
  }, [mapboxToken, showTokenInput]);

  return {
    map: map.current,
    mapContainer,
    isLoading,
    error,
    mapboxToken,
    showTokenInput
  };
};