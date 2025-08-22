
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceAddressesSection } from './ServiceAddressesSection';
import { MapPin, Navigation, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: functionError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (functionError) {
          throw new Error(functionError.message || 'Failed to fetch Mapbox token');
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          throw new Error('No Mapbox token received');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
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
      });

    } catch (error) {
      console.error('Mapbox initialization error:', error);
      setError('Failed to initialize map');
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

  const searchAddress = async () => {
    if (!searchQuery.trim() || !map.current) return;

    setIsSearching(true);
    try {
      const { data, error: searchError } = await supabase.functions.invoke('mapbox-geocoding', {
        body: { query: searchQuery.trim(), limit: 1 }
      });

      if (searchError) {
        console.error('Geocoding error:', searchError);
        return;
      }

      if (data?.suggestions && data.suggestions.length > 0) {
        const result = data.suggestions[0];
        if (result.longitude && result.latitude) {
          map.current.flyTo({
            center: [result.longitude, result.latitude],
            zoom: 14,
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchAddress();
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
            Search for an address to navigate, then click anywhere to drop pins.
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

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!searchQuery.trim() || isSearching}
          className="px-6"
        >
          {isSearching ? 'Searching...' : 'Go'}
        </Button>
      </form>
      
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
