import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SavedPin {
  id: string;
  pin_id: string;
  latitude: number;
  longitude: number;
  label: string;
  notes?: string;
}

interface ReadOnlyPinsMapProps {
  customerId: string;
  className?: string;
}

export function ReadOnlyPinsMap({ customerId, className = '' }: ReadOnlyPinsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Fetch Mapbox token
  const { data: tokenData } = useQuery({
    queryKey: ['mapboxToken'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      return data;
    },
  });

  // Fetch saved pins for this customer
  const { data: savedPins = [], isLoading } = useQuery({
    queryKey: ['customerMapPins', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_map_pins')
        .select('*')
        .eq('customer_id', customerId)
        .order('label');
      
      if (error) throw error;
      return data as SavedPin[];
    },
    enabled: !!customerId,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !tokenData?.token || map.current) return;

    mapboxgl.accessToken = tokenData.token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of US as default
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [tokenData]);

  // Update markers when pins change
  useEffect(() => {
    if (!map.current || !mapLoaded || !savedPins.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    const bounds = new mapboxgl.LngLatBounds();

    savedPins.forEach((pin) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = '#3b82f6';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';

      const icon = document.createElement('div');
      icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>`;
      el.appendChild(icon);

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="font-weight: 600; margin-bottom: 4px;">${pin.label}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 4px;">
            ${pin.latitude.toFixed(6)}, ${pin.longitude.toFixed(6)}
          </p>
          ${pin.notes ? `<p style="font-size: 12px; margin-top: 8px;">${pin.notes}</p>` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
      bounds.extend([pin.longitude, pin.latitude]);
    });

    // Fit map to show all pins
    if (savedPins.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    }
  }, [savedPins, mapLoaded]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading reference pins...</p>
        </div>
      </div>
    );
  }

  if (!savedPins.length) {
    return (
      <Card className="bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Reference Pins</h3>
          <p className="text-sm text-muted-foreground text-center">
            This customer has no saved GPS reference pins yet.
            <br />
            Add pins in the Customer section for future reference.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Display */}
      <div className="h-[400px] rounded-lg overflow-hidden border shadow-sm">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Pin List */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Saved Reference Pins ({savedPins.length})
          </h3>
          <div className="space-y-2">
            {savedPins.map((pin) => (
              <div
                key={pin.id}
                className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{pin.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                    </p>
                    {pin.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{pin.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
