
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceAddressesSection } from './ServiceAddressesSection';
import { MapPin, Navigation, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface ServiceLocationTabProps {
  customerId: string;
}

interface DropPin {
  id: string;
  longitude: number;
  latitude: number;
  label: string;
}

const DropMapPinsSection = ({ customerId }: { customerId: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [pins, setPins] = useState<DropPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number, address: string} | null>(null);

  useEffect(() => {
    const fetchMapboxTokenAndCustomer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch Mapbox token and customer data in parallel
        const [tokenResponse, customerResponse] = await Promise.all([
          supabase.functions.invoke('get-mapbox-token'),
          supabase
            .from('customer_service_locations')
            .select('gps_coordinates, street, street2, city, state, zip, location_name')
            .eq('customer_id', customerId)
            .eq('is_default', true)
            .maybeSingle()
        ]);
        
        if (tokenResponse.error) {
          throw new Error(tokenResponse.error.message || 'Failed to fetch Mapbox token');
        }
        
        if (tokenResponse.data?.token) {
          setMapboxToken(tokenResponse.data.token);
        } else {
          throw new Error('No Mapbox token received');
        }

        // Set customer location if available
        if (customerResponse.data && customerResponse.data.gps_coordinates) {
          const coordinates = customerResponse.data.gps_coordinates as any;
          const address = [
            customerResponse.data.street,
            customerResponse.data.street2,
            customerResponse.data.city,
            customerResponse.data.state,
            customerResponse.data.zip
          ].filter(Boolean).join(', ');

          setCustomerLocation({
            lat: coordinates.y || coordinates.latitude,
            lng: coordinates.x || coordinates.longitude,
            address: customerResponse.data.location_name || address
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapboxTokenAndCustomer();
  }, [customerId]);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      // Center on customer location if available, otherwise use default
      const mapCenter = customerLocation ? [customerLocation.lng, customerLocation.lat] : [-95.7129, 37.0902];
      const mapZoom = customerLocation ? 12 : 4;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: mapCenter as [number, number],
        zoom: mapZoom
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add main service location marker if available
      if (customerLocation) {
        const homeMarker = new mapboxgl.Marker({
          color: '#22c55e', // Green color for home base
          scale: 1.2
        })
          .setLngLat([customerLocation.lng, customerLocation.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<div style="padding: 8px;"><strong>🏠 Main Service Location</strong><br/>${customerLocation.address}<br/>Lat: ${customerLocation.lat.toFixed(6)}<br/>Lng: ${customerLocation.lng.toFixed(6)}</div>`)
          )
          .addTo(map.current);
      }

      // Add click handler to drop pins
      map.current.on('click', (e) => {
        const newPin: DropPin = {
          id: `pin-${Date.now()}`,
          longitude: e.lngLat.lng,
          latitude: e.lngLat.lat,
          label: `Pin ${pins.length + 1}`
        };

        // Add marker to map (blue color for user-dropped pins)
        const marker = new mapboxgl.Marker({
          color: '#3b82f6',
          draggable: false
        })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<div style="padding: 4px;"><strong>${newPin.label}</strong><br/>Lat: ${e.lngLat.lat.toFixed(6)}<br/>Lng: ${e.lngLat.lng.toFixed(6)}</div>`)
          )
          .addTo(map.current!);

        setPins(prev => [...prev, newPin]);
      });

    } catch (error) {
      console.error('Mapbox initialization error:', error);
      setError('Failed to initialize map');
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, customerLocation, pins.length]);

  const clearAllPins = () => {
    if (map.current) {
      // Remove all markers
      const markers = document.querySelectorAll('.mapboxgl-marker');
      markers.forEach(marker => marker.remove());
    }
    setPins([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-medium text-foreground mb-2">Drop Map Pins</h3>
          <p className="text-muted-foreground">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Drop Map Pins</h3>
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Interactive Map</h3>
          <p className="text-sm text-muted-foreground">
            Click anywhere on the map to drop a pin. This is for reference only.
          </p>
        </div>
        {pins.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllPins}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Pins ({pins.length})
          </Button>
        )}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        />
      </div>
      
      {pins.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Dropped Pins ({pins.length})</h4>
          <div className="grid gap-2 max-h-32 overflow-y-auto">
            {pins.map((pin) => (
              <div key={pin.id} className="flex items-center justify-between text-sm">
                <span>{pin.label}</span>
                <span className="text-muted-foreground font-mono">
                  {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function ServiceLocationTab({ customerId }: ServiceLocationTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Service Locations</h3>
        
        <Tabs defaultValue="addresses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Physical Addresses
            </TabsTrigger>
            <TabsTrigger value="pins" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Drop Map Pins
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="addresses" className="mt-6">
            <ServiceAddressesSection customerId={customerId} />
          </TabsContent>
          
          <TabsContent value="pins" className="mt-6">
            <DropMapPinsSection customerId={customerId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
