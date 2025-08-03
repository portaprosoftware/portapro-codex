import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Pin {
  id: string;
  point_name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface ServiceLocation {
  id: string;
  location_name: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  gps_coordinates?: { x: number; y: number } | null;
}

interface MapViewProps {
  pins: Pin[];
  selectedLocation?: ServiceLocation;
  onPinClick?: (pin: Pin) => void;
  className?: string;
}

export function MapView({ pins, selectedLocation, onPinClick, className = "w-full h-full" }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const { toast } = useToast();

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        toast({
          title: "Map Error",
          description: "Failed to load map. Please check your Mapbox configuration.",
          variant: "destructive"
        });
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Determine center point
    let center: [number, number] = [-81.8392, 41.3668]; // Default to Ohio
    
    if (selectedLocation?.gps_coordinates) {
      // Handle different coordinate formats
      let lng, lat;
      if (typeof selectedLocation.gps_coordinates === 'object' && selectedLocation.gps_coordinates !== null) {
        if ('x' in selectedLocation.gps_coordinates && 'y' in selectedLocation.gps_coordinates) {
          lng = selectedLocation.gps_coordinates.x;
          lat = selectedLocation.gps_coordinates.y;
        } else if (Array.isArray(selectedLocation.gps_coordinates)) {
          lng = selectedLocation.gps_coordinates[0];
          lat = selectedLocation.gps_coordinates[1];
        }
      }
      
      // Validate coordinates are valid numbers
      if (typeof lng === 'number' && typeof lat === 'number' && 
          !isNaN(lng) && !isNaN(lat) && 
          lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        center = [lng, lat];
      }
    } else if (pins.length > 0) {
      // Center on first pin if no location selected and coordinates are valid
      const firstPin = pins[0];
      if (typeof firstPin.longitude === 'number' && typeof firstPin.latitude === 'number' &&
          !isNaN(firstPin.longitude) && !isNaN(firstPin.latitude) &&
          firstPin.longitude >= -180 && firstPin.longitude <= 180 && 
          firstPin.latitude >= -90 && firstPin.latitude <= 90) {
        center = [firstPin.longitude, firstPin.latitude];
      }
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for pins
    pins.forEach((pin) => {
      if (!map.current) return;

      // Validate pin coordinates before creating marker
      if (typeof pin.longitude !== 'number' || typeof pin.latitude !== 'number' ||
          isNaN(pin.longitude) || isNaN(pin.latitude) ||
          pin.longitude < -180 || pin.longitude > 180 ||
          pin.latitude < -90 || pin.latitude > 90) {
        console.warn('Invalid coordinates for pin:', pin);
        return;
      }

      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.width = '30px';
      markerEl.style.height = '30px';
      markerEl.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNFRjQ0NDQiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjE1IiBjeT0iMTUiIHI9IjYiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+)';
      markerEl.style.backgroundSize = 'contain';
      markerEl.style.cursor = 'pointer';

      // Add click event
      markerEl.addEventListener('click', () => {
        onPinClick?.(pin);
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map.current!);

      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-medium text-sm">${pin.point_name}</h3>
            ${pin.description ? `<p class="text-xs text-gray-600 mt-1">${pin.description}</p>` : ''}
          </div>
        `);

      marker.setPopup(popup);
    });

    // Add marker for service location if available
    if (selectedLocation?.gps_coordinates) {
      let lng, lat;
      if (typeof selectedLocation.gps_coordinates === 'object' && selectedLocation.gps_coordinates !== null) {
        if ('x' in selectedLocation.gps_coordinates && 'y' in selectedLocation.gps_coordinates) {
          lng = selectedLocation.gps_coordinates.x;
          lat = selectedLocation.gps_coordinates.y;
        } else if (Array.isArray(selectedLocation.gps_coordinates)) {
          lng = selectedLocation.gps_coordinates[0];
          lat = selectedLocation.gps_coordinates[1];
        }
      }
      
      // Only add marker if coordinates are valid
      if (typeof lng === 'number' && typeof lat === 'number' && 
          !isNaN(lng) && !isNaN(lat) && 
          lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        
        const locationMarkerEl = document.createElement('div');
        locationMarkerEl.className = 'location-marker';
        locationMarkerEl.style.width = '40px';
        locationMarkerEl.style.height = '40px';
        locationMarkerEl.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTkiIGZpbGw9IiMyNTYzRUIiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjxwb2x5Z29uIHBvaW50cz0iMjAsMTAgMjUsMTggMTUsMTgiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+)';
        locationMarkerEl.style.backgroundSize = 'contain';

        new mapboxgl.Marker(locationMarkerEl)
          .setLngLat([lng, lat])
          .addTo(map.current!)
          .setPopup(
            new mapboxgl.Popup({ offset: 30 })
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-medium text-sm">${selectedLocation.location_name}</h3>
                  <p class="text-xs text-gray-600 mt-1">Service Location</p>
                </div>
              `)
          );
      }
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, pins, selectedLocation, onPinClick]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}