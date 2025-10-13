import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Trash2, Edit2, X, Search, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DroppedPin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

interface GPSPinDropperProps {
  pins: DroppedPin[];
  onPinsChange: (pins: DroppedPin[]) => void;
  className?: string;
}

export function GPSPinDropper({ pins, onPinsChange, className }: GPSPinDropperProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  
  const [isDropMode, setIsDropMode] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // You'll need to add MAPBOX_PUBLIC_TOKEN to environment variables
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY201ZW53ZnFuMHZmMTJyczl5N2poYWxmcCJ9.placeholder';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before accessing canvas
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add click handler for dropping pins
    map.current.on('click', (e) => {
      if (isDropMode) {
        const newPin: DroppedPin = {
          id: `pin-${Date.now()}`,
          label: `Pin ${pins.length + 1}`,
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng,
        };
        onPinsChange([...pins, newPin]);
        setIsDropMode(false);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update cursor when drop mode changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      const canvas = map.current.getCanvas();
      if (canvas) {
        canvas.style.cursor = isDropMode ? 'crosshair' : '';
      }
    }
  }, [isDropMode, mapLoaded]);

  // Update markers when pins change
  useEffect(() => {
    if (!map.current) return;

    // Remove markers that no longer exist
    Object.keys(markers.current).forEach(id => {
      if (!pins.find(pin => pin.id === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    // Add/update markers
    pins.forEach(pin => {
      if (!markers.current[pin.id]) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3B82F6';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([pin.longitude, pin.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<strong>${pin.label}</strong><br/>${pin.latitude.toFixed(6)}, ${pin.longitude.toFixed(6)}`)
          )
          .addTo(map.current!);

        markers.current[pin.id] = marker;
      }
    });
  }, [pins]);

  const handleSearch = async () => {
    if (!searchAddress || !map.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleDeletePin = (pinId: string) => {
    onPinsChange(pins.filter(pin => pin.id !== pinId));
  };

  const handleEditPin = (pin: DroppedPin) => {
    setEditingPinId(pin.id);
    setEditLabel(pin.label);
  };

  const handleSaveEdit = () => {
    if (editingPinId) {
      onPinsChange(
        pins.map(pin =>
          pin.id === editingPinId ? { ...pin, label: editLabel } : pin
        )
      );
      setEditingPinId(null);
      setEditLabel('');
    }
  };

  const handleClearAllPins = () => {
    onPinsChange([]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Interactive Map</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Search for an address to navigate, then activate drop mode to place pins
          </p>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for an address..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              Go
            </Button>
            {pins.length > 0 && (
              <Button
                onClick={handleClearAllPins}
                variant="outline"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Pins ({pins.length})
              </Button>
            )}
          </div>

          {/* Map Container */}
          <div className="relative rounded-lg overflow-hidden border mb-4">
            <div ref={mapContainer} className="h-96 w-full" />
            {/* Map Type Toggle */}
            <div className="absolute top-3 left-3 bg-white rounded shadow-md overflow-hidden">
              <button
                onClick={() => map.current?.setStyle('mapbox://styles/mapbox/streets-v12')}
                className="px-3 py-2 text-sm hover:bg-gray-100 border-r"
              >
                Streets
              </button>
              <button
                onClick={() => map.current?.setStyle('mapbox://styles/mapbox/satellite-streets-v12')}
                className="px-3 py-2 text-sm hover:bg-gray-100"
              >
                Satellite
              </button>
            </div>
          </div>

          {/* Activate Drop Mode Button */}
          <Button
            onClick={() => setIsDropMode(!isDropMode)}
            variant={isDropMode ? "default" : "outline"}
            className={cn(
              "w-full gap-2",
              isDropMode && "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            )}
          >
            <Navigation className="h-4 w-4" />
            {isDropMode ? 'Drop Mode Active - Click Map to Place Pin' : 'Activate Drop Mode'}
          </Button>
        </CardContent>
      </Card>

      {/* Dropped Pins List */}
      {pins.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Dropped Pins ({pins.length})</h3>
            <div className="space-y-2">
              {pins.map((pin) => (
                <div
                  key={pin.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  {editingPinId === pin.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingPinId(null);
                          setEditLabel('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{pin.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPin(pin)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePin(pin.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
