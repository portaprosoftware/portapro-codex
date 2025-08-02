import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Satellite, Map } from 'lucide-react';

interface AddPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLocation: any;
  onPinAdded: () => void;
}

export function AddPinModal({ isOpen, onClose, serviceLocation, onPinAdded }: AddPinModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentMarker = useRef<mapboxgl.Marker | null>(null);
  const addressMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapStyle, setMapStyle] = useState<'satellite' | 'street'>('satellite');
  const [pinData, setPinData] = useState({
    name: '',
    description: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [addressCoordinates, setAddressCoordinates] = useState<[number, number] | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  // Build full address string
  const fullAddress = [
    serviceLocation?.street,
    serviceLocation?.street2,
    serviceLocation?.city,
    serviceLocation?.state,
    serviceLocation?.zip
  ].filter(Boolean).join(', ');

  // Geocode address if no GPS coordinates exist
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!mapboxToken || !fullAddress || addressCoordinates) return;
      
      try {
        const { data } = await supabase.functions.invoke('mapbox-geocoding', {
          body: { 
            query: fullAddress,
            limit: 1 
          }
        });
        
        if (data?.suggestions?.[0]?.coordinates) {
          const coords = data.suggestions[0].coordinates;
          setAddressCoordinates([coords.longitude, coords.latitude]);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    };

    if (isOpen && mapboxToken && !serviceLocation?.gps_coordinates) {
      geocodeAddress();
    }
  }, [isOpen, mapboxToken, fullAddress, serviceLocation?.gps_coordinates, addressCoordinates]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        toast.error('Failed to load map');
      }
    };

    if (isOpen) {
      fetchToken();
    }
  }, [isOpen]);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapboxToken || !mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = mapboxToken;

    // Default center - try multiple sources for location
    let center: [number, number] = [-98.5795, 39.8283]; // US center as fallback
    let zoom = 4;
    
    // Priority 1: Use existing GPS coordinates
    if (serviceLocation?.gps_coordinates?.x && serviceLocation?.gps_coordinates?.y) {
      center = [serviceLocation.gps_coordinates.x, serviceLocation.gps_coordinates.y];
      zoom = 15;
    } 
    // Priority 2: Use geocoded coordinates
    else if (addressCoordinates) {
      center = addressCoordinates;
      zoom = 15;
    }
    // Priority 3: If we have address but no coordinates, use broader zoom
    else if (fullAddress) {
      zoom = 10;
    }

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    });

    // Set loading to false once map is ready
    map.current.on('load', () => {
      setMapLoading(false);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add address marker if coordinates exist
    const markerCoords = serviceLocation?.gps_coordinates?.x && serviceLocation?.gps_coordinates?.y
      ? [serviceLocation.gps_coordinates.x, serviceLocation.gps_coordinates.y] as [number, number]
      : addressCoordinates;
      
    if (markerCoords) {
      addressMarker.current = new mapboxgl.Marker({ 
        color: '#3b82f6',
        scale: 1.2
      })
        .setLngLat(markerCoords)
        .setPopup(new mapboxgl.Popup().setHTML(`
          <strong>${serviceLocation.location_name}</strong><br/>
          <small>${fullAddress}</small>
        `))
        .addTo(map.current);
    }

    // Add click handler for dropping pins
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Remove existing marker
      if (currentMarker.current) {
        currentMarker.current.remove();
      }

      // Add new marker
      currentMarker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Update pin data
      setPinData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    });

    return () => {
      // Cleanup is handled in handleClose to avoid conflicts
    };
  }, [isOpen, mapboxToken, serviceLocation, addressCoordinates, fullAddress]);

  // Reset coordinates when modal reopens
  useEffect(() => {
    if (isOpen) {
      setAddressCoordinates(null);
      setMapLoading(true);
    }
  }, [isOpen]);

  // Update map style when changed
  useEffect(() => {
    if (map.current) {
      const newStyle = mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/streets-v12';
      
      // Force style change and re-render
      map.current.setStyle(newStyle);
      map.current.once('styledata', () => {
        // Re-add markers after style loads
        const markerCoords = serviceLocation?.gps_coordinates?.x && serviceLocation?.gps_coordinates?.y
          ? [serviceLocation.gps_coordinates.x, serviceLocation.gps_coordinates.y] as [number, number]
          : addressCoordinates;
          
        if (markerCoords && addressMarker.current) {
          addressMarker.current.remove();
          addressMarker.current = new mapboxgl.Marker({ 
            color: '#3b82f6',
            scale: 1.2
          })
            .setLngLat(markerCoords)
            .setPopup(new mapboxgl.Popup().setHTML(`
              <strong>${serviceLocation.location_name}</strong><br/>
              <small>${fullAddress}</small>
            `))
            .addTo(map.current!);
        }
      });
    }
  }, [mapStyle, serviceLocation, addressCoordinates, fullAddress]);

  const handleSave = async () => {
    if (!pinData.latitude || !pinData.longitude || !pinData.name.trim()) {
      toast.error('Please click on the map to set coordinates and enter a name');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('service_location_coordinates')
        .insert({
          service_location_id: serviceLocation.id,
          point_name: pinData.name.trim(),
          description: pinData.description.trim() || null,
          latitude: pinData.latitude,
          longitude: pinData.longitude,
        });

      if (error) throw error;

      onPinAdded();
      handleClose();
    } catch (error) {
      console.error('Error saving pin:', error);
      toast.error('Failed to save GPS pin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Clean up map and markers
    if (currentMarker.current) {
      currentMarker.current.remove();
      currentMarker.current = null;
    }
    if (addressMarker.current) {
      addressMarker.current.remove();
      addressMarker.current = null;
    }
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Reset all state
    setPinData({
      name: '',
      description: '',
      latitude: null,
      longitude: null,
    });
    setAddressCoordinates(null);
    setMapLoading(true);
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Add GPS Drop-Pin
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">
            <strong>{serviceLocation?.location_name}</strong>
            {fullAddress && (
              <div className="mt-1">{fullAddress}</div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex gap-6">
          {/* Map */}
          <div className="flex-1 relative">
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex overflow-hidden">
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    mapStyle === 'satellite'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Satellite className="w-4 h-4 mr-2 inline" />
                  Satellite
                </button>
                <button
                  onClick={() => setMapStyle('street')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    mapStyle === 'street'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Map className="w-4 h-4 mr-2 inline" />
                  Streets
                </button>
              </div>
            </div>
            
            {mapLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex items-center gap-2 text-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span>Loading map...</span>
                </div>
              </div>
            )}
            
            <div ref={mapContainer} className="w-full h-full rounded-lg" />
            
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Click on the map to drop a pin</p>
              {pinData.latitude && pinData.longitude && (
                <p className="text-primary font-medium">
                  Pin: {pinData.latitude.toFixed(6)}, {pinData.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="w-80 space-y-4">
            <div>
              <Label htmlFor="pin-name">Pin Name *</Label>
              <Input
                id="pin-name"
                value={pinData.name}
                onChange={(e) => setPinData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Entrance, Loading Dock"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pin-description">Description</Label>
              <Textarea
                id="pin-description"
                value={pinData.description}
                onChange={(e) => setPinData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional notes about this location..."
                className="mt-1"
                rows={3}
              />
            </div>

            {pinData.latitude && pinData.longitude && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Coordinates:</p>
                <p>Lat: {pinData.latitude.toFixed(6)}</p>
                <p>Lng: {pinData.longitude.toFixed(6)}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={!pinData.latitude || !pinData.longitude || !pinData.name.trim() || isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Pin'}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}