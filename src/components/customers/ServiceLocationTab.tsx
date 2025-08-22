
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceAddressesSection } from './ServiceAddressesSection';
import { MapPin, Navigation, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    // Use the user-provided token
    const token = mapboxToken;
    
    if (!token || !mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-95.7129, 37.0902], // Center of US
        zoom: 4
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add click handler to drop pins
      map.current.on('click', (e) => {
        const newPin: DropPin = {
          id: `pin-${Date.now()}`,
          longitude: e.lngLat.lng,
          latitude: e.lngLat.lat,
          label: `Pin ${pins.length + 1}`
        };

        // Add marker to map
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
        setShowTokenInput(false);
      });

    } catch (error) {
      console.error('Mapbox initialization error:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, pins.length]);

  const clearAllPins = () => {
    if (map.current) {
      // Remove all markers
      const markers = document.querySelectorAll('.mapboxgl-marker');
      markers.forEach(marker => marker.remove());
    }
    setPins([]);
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
    }
  };

  if (showTokenInput) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Drop Map Pins</h3>
          <p className="text-muted-foreground mb-6">
            Enter your Mapbox public token to enable the interactive map.
          </p>
          
          <form onSubmit={handleTokenSubmit} className="max-w-md mx-auto space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.ey..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button type="submit" disabled={!mapboxToken.trim()}>
              Initialize Map
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-4">
            Get your token at{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              mapbox.com
            </a>
          </p>
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
