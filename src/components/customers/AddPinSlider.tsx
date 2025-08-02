import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, MapPin, Plus, Target, Map, Satellite } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface ServiceLocation {
  id: string;
  location_name: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  gps_coordinates?: {
    x: number;
    y: number;
  } | null;
}
interface AddPinSliderProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLocation: ServiceLocation;
  onPinAdded: () => void;
}
export function AddPinSlider({
  isOpen,
  onClose,
  serviceLocation,
  onPinAdded
}: AddPinSliderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentMarker = useRef<mapboxgl.Marker | null>(null);
  const addressMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapStyle, setMapStyle] = useState<'satellite' | 'street'>('satellite');
  const [isPinModeActive, setIsPinModeActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressCoordinates, setAddressCoordinates] = useState<[number, number] | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [pinPlaced, setPinPlaced] = useState(false);
  const [formData, setFormData] = useState({
    point_name: '',
    description: '',
    category: 'service_location', // Add required category field
    latitude: null as number | null,
    longitude: null as number | null
  });

  // Build full address string
  const fullAddress = [serviceLocation?.street, serviceLocation?.street2, serviceLocation?.city, serviceLocation?.state, serviceLocation?.zip].filter(Boolean).join(', ');

  // Geocode address immediately when modal opens
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!mapboxToken || !fullAddress) {
        console.log('Skipping geocoding - missing token or address:', { mapboxToken: !!mapboxToken, fullAddress });
        return;
      }
      
      if (serviceLocation?.gps_coordinates) {
        console.log('Skipping geocoding - GPS coordinates exist:', serviceLocation.gps_coordinates);
        return;
      }

      console.log('Starting geocoding for address:', fullAddress);
      
      try {
        const { data } = await supabase.functions.invoke('mapbox-geocoding', {
          body: {
            query: fullAddress,
            limit: 1
          }
        });
        
        console.log('Geocoding response:', data);
        
        if (data?.suggestions?.[0]?.coordinates) {
          const coords = data.suggestions[0].coordinates;
          const addressCoords: [number, number] = [coords.longitude, coords.latitude];
          console.log('Setting address coordinates:', addressCoords);
          setAddressCoordinates(addressCoords);
        } else {
          console.error('No coordinates found in geocoding response');
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    };

    if (isOpen && mapboxToken && fullAddress && !serviceLocation?.gps_coordinates) {
      geocodeAddress();
    }
  }, [isOpen, mapboxToken, fullAddress, serviceLocation?.gps_coordinates]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const {
          data
        } = await supabase.functions.invoke('get-mapbox-token');
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

  // Initialize map (copied exactly from working MapView)
  useEffect(() => {
    if (!isOpen || !mapboxToken || !mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = mapboxToken;

    // Determine center point (exact same logic as MapView)
    let center: [number, number] = [-81.8392, 41.3668]; // Default to Ohio
    
    if (serviceLocation?.gps_coordinates) {
      // Handle different coordinate formats
      let lng, lat;
      if (typeof serviceLocation.gps_coordinates === 'object' && serviceLocation.gps_coordinates !== null) {
        if ('x' in serviceLocation.gps_coordinates && 'y' in serviceLocation.gps_coordinates) {
          lng = serviceLocation.gps_coordinates.x;
          lat = serviceLocation.gps_coordinates.y;
        } else if (Array.isArray(serviceLocation.gps_coordinates)) {
          lng = serviceLocation.gps_coordinates[0];
          lat = serviceLocation.gps_coordinates[1];
        }
      }
      
      // Validate coordinates are valid numbers
      if (typeof lng === 'number' && typeof lat === 'number' && 
          !isNaN(lng) && !isNaN(lat) && 
          lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        center = [lng, lat];
      }
    }

    // Initialize map (exact same as MapView)
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 16,
    });

    // Set loading to false once map is ready
    map.current.on('load', () => {
      setMapLoading(false);
      addAddressMarker(); // Add marker after map loads
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      // Cleanup handled in handleClose
    };
  }, [isOpen, mapboxToken, serviceLocation, mapStyle]);

  // Function to add address marker
  const addAddressMarker = () => {
    if (!map.current) {
      console.log('No map instance available');
      return;
    }
    
    // Remove existing address marker
    if (addressMarker.current) {
      addressMarker.current.remove();
      addressMarker.current = null;
    }

    let markerCoords: [number, number] | null = null;
    
    // Priority 1: Use GPS coordinates if available
    if (serviceLocation?.gps_coordinates) {
      let lng, lat;
      if (typeof serviceLocation.gps_coordinates === 'object' && serviceLocation.gps_coordinates !== null) {
        if ('x' in serviceLocation.gps_coordinates && 'y' in serviceLocation.gps_coordinates) {
          lng = serviceLocation.gps_coordinates.x;
          lat = serviceLocation.gps_coordinates.y;
        }
      }
      
      if (typeof lng === 'number' && typeof lat === 'number' && 
          !isNaN(lng) && !isNaN(lat) && 
          lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        markerCoords = [lng, lat];
        console.log('Using GPS coordinates for marker:', markerCoords);
      }
    } 
    // Priority 2: Use geocoded coordinates if no GPS coordinates
    else if (addressCoordinates) {
      markerCoords = addressCoordinates;
      console.log('Using geocoded coordinates for marker:', markerCoords);
    }
    
    // Create and add the blue address marker if we have valid coordinates
    if (markerCoords) {
      console.log('Creating blue address marker at:', markerCoords);
      addressMarker.current = new mapboxgl.Marker({
        color: '#3b82f6',
        scale: 1.2
      }).setLngLat(markerCoords).setPopup(new mapboxgl.Popup().setHTML(`
          <strong>${serviceLocation.location_name}</strong><br/>
          <small>${fullAddress}</small>
        `)).addTo(map.current);
      console.log('Blue address marker added successfully');
    } else {
      console.log('No valid coordinates found for address marker');
    }
  };

  // Update map center when geocoded coordinates become available
  useEffect(() => {
    if (!map.current || !addressCoordinates || serviceLocation?.gps_coordinates) return;
    
    console.log('Updating map center to geocoded coordinates:', addressCoordinates);
    map.current.flyTo({
      center: addressCoordinates,
      zoom: 18, // Much closer zoom
      duration: 1000
    });
    
    // Add the address marker
    addAddressMarker();
  }, [addressCoordinates]);

  // Separate useEffect for handling pin mode click events and cursor
  useEffect(() => {
    if (!map.current) return;

    // Change cursor style when pin mode changes
    if (isPinModeActive) {
      map.current.getCanvas().style.cursor = 'crosshair';
    } else {
      map.current.getCanvas().style.cursor = '';
    }

    // Add click handler for dropping pins (only when pin mode is active)
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isPinModeActive) return;
      const { lng, lat } = e.lngLat;

      // Remove existing red marker
      if (currentMarker.current) {
        currentMarker.current.remove();
      }

      // Add new red marker
      currentMarker.current = new mapboxgl.Marker({
        color: '#ef4444'
      }).setLngLat([lng, lat]).addTo(map.current!);

      // Update pin data and mark pin as placed
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
      setPinPlaced(true);
      setIsPinModeActive(false);
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
        // Reset cursor on cleanup
        map.current.getCanvas().style.cursor = '';
      }
    };
  }, [isPinModeActive]);

  // Reset coordinates when modal reopens
  useEffect(() => {
    if (isOpen) {
      setAddressCoordinates(null);
      setMapLoading(true);
      setIsPinModeActive(false);
    }
  }, [isOpen]);

  // Update map style when changed
  useEffect(() => {
    if (map.current) {
      const newStyle = mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/streets-v12';

      // Force style change and re-render
      map.current.setStyle(newStyle);
      map.current.once('styledata', () => {
        // Re-add address marker after style loads (style change removes all markers)
        const markerCoords = (() => {
          if (serviceLocation?.gps_coordinates) {
            let lng, lat;
            if (typeof serviceLocation.gps_coordinates === 'object' && serviceLocation.gps_coordinates !== null) {
              if ('x' in serviceLocation.gps_coordinates && 'y' in serviceLocation.gps_coordinates) {
                lng = serviceLocation.gps_coordinates.x;
                lat = serviceLocation.gps_coordinates.y;
              }
            }
            if (typeof lng === 'number' && typeof lat === 'number' && 
                !isNaN(lng) && !isNaN(lat)) {
              return [lng, lat] as [number, number];
            }
          }
          return addressCoordinates;
        })();
        if (markerCoords) {
          // Remove existing marker reference since style change cleared it
          addressMarker.current = null;
          
          // Create new address marker
          addressMarker.current = new mapboxgl.Marker({
            color: '#3b82f6',
            scale: 1.2
          }).setLngLat(markerCoords).setPopup(new mapboxgl.Popup().setHTML(`
              <strong>${serviceLocation.location_name}</strong><br/>
              <small>${fullAddress}</small>
            `)).addTo(map.current!);
        }
        
        // Re-add red pin if it exists
        if (formData.latitude && formData.longitude) {
          currentMarker.current = new mapboxgl.Marker({
            color: '#ef4444'
          }).setLngLat([formData.longitude, formData.latitude]).addTo(map.current!);
        }
      });
    }
  }, [mapStyle, serviceLocation, addressCoordinates, fullAddress, formData.latitude, formData.longitude]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.point_name || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields and drop a pin on the map');
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('service_location_coordinates').insert({
        service_location_id: serviceLocation.id,
        point_name: formData.point_name,
        description: formData.description || null,
        category: formData.category,
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      if (error) throw error;
      handleClose();
      onPinAdded();
    } catch (error) {
      console.error('Error adding pin:', error);
      toast.error('Failed to add GPS pin');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    setFormData({
      point_name: '',
      description: '',
      category: 'service_location',
      latitude: null,
      longitude: null
    });
    setAddressCoordinates(null);
    setMapLoading(true);
    setIsPinModeActive(false);
    setPinPlaced(false);
    onClose();
  };
  if (!isOpen) return null;
  return <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      
      {/* Slider */}
      <div className="fixed right-0 top-0 h-full w-full md:w-3/4 bg-background border-l shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Add GPS Drop-Pin</h2>
              <p className="text-sm text-muted-foreground">
                Add a new GPS coordinate for {serviceLocation.location_name}
              </p>
              {fullAddress && <p className="text-xs text-muted-foreground mt-1">{fullAddress}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6 p-6">
          {/* Map Section */}
          <div className="flex-1 flex flex-col">
            {/* Directions */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-sm mb-2">Quick Guide:</h3>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Zoom to desired location</li>
                <li>2. Select: Activate Pin Selector</li>
                <li>3. Drop target anywhere on map</li>
                <li>4. Name and save pin location</li>
              </ol>
            </div>

            {/* Map Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="bg-background rounded-lg shadow-sm border flex overflow-hidden">
                <button onClick={() => setMapStyle('satellite')} className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${mapStyle === 'satellite' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}>
                  <Satellite className="w-4 h-4" />
                  Satellite
                </button>
                <button onClick={() => setMapStyle('street')} className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${mapStyle === 'street' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}>
                  <Map className="w-4 h-4" />
                  Streets
                </button>
              </div>

              <Button 
                onClick={() => setIsPinModeActive(!isPinModeActive)} 
                variant={isPinModeActive ? "default" : "outline"} 
                disabled={pinPlaced}
                className="flex items-center gap-2"
              >
                <Target className={`w-4 h-4 ${isPinModeActive ? 'text-red-600' : ''}`} />
                {pinPlaced ? 'Pin Added' : isPinModeActive ? 'Pin Mode: ON' : 'Activate Pin Selector'}
              </Button>
            </div>

            {/* Map Container */}
            <div className={`flex-1 relative bg-muted/20 border border-border rounded-lg overflow-hidden min-h-[400px] ${isPinModeActive ? 'cursor-crosshair' : 'cursor-auto'}`} style={isPinModeActive ? { cursor: 'crosshair' } : {}}>
              {mapLoading && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="flex items-center gap-2 text-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Loading map...</span>
                  </div>
                </div>}
              
              <div ref={mapContainer} className="w-full h-full" />
              
              {/* Map Status */}
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-lg p-3 text-sm max-w-xs">
                {!isPinModeActive ? <p className="text-muted-foreground">Click "Activate Pin Selector" to drop pins</p> : formData.latitude && formData.longitude ? <p className="text-primary font-medium">
                    Pin: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p> : <p className="text-primary">Click on the map to drop a pin</p>}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="w-full lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="point_name">Pin Name *</Label>
                <Input id="point_name" value={formData.point_name} onChange={e => handleInputChange('point_name', e.target.value)} placeholder="e.g., Loading Dock, Front Entrance" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Optional description for this location" rows={3} />
              </div>

              {formData.latitude && formData.longitude && <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Coordinates:</p>
                  <p>Lat: {formData.latitude.toFixed(6)}</p>
                  <p>Lng: {formData.longitude.toFixed(6)}</p>
                </div>}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={!formData.latitude || !formData.longitude || !formData.point_name || isSubmitting} className="flex items-center gap-2 flex-1">
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'Adding...' : 'Add Pin'}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>;
}