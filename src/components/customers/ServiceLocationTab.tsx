
import React, { useState, useEffect, useRef } from 'react';
import { ServiceAddressesSection } from './ServiceAddressesSection';
import { MapPin, Navigation, Trash2, Search, Target, Plus, Edit, Layers, Home, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  notes?: string;
  service_location_id?: string | null;
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

const DropMapPinsSection = ({ customerId }: { customerId: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const locationMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState('');
  const [pins, setPins] = useState<DropPin[]>([]);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dropModeActive, setDropModeActive] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPin, setEditingPin] = useState<DropPin | null>(null);
  const [deletingPin, setDeletingPin] = useState<DropPin | null>(null);
  const [pendingPin, setPendingPin] = useState<{ longitude: number; latitude: number } | null>(null);
  const [pinName, setPinName] = useState('');
  const [pinNotes, setPinNotes] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');

  // Load existing pins and service locations from database
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load pins
        const { data: existingPins, error: pinsError } = await supabase
          .from('customer_map_pins')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: true });

        if (pinsError) {
          console.error('Error loading existing pins:', pinsError);
        } else if (existingPins && existingPins.length > 0) {
          const loadedPins: DropPin[] = existingPins.map(pin => ({
            id: pin.pin_id,
            longitude: Number(pin.longitude),
            latitude: Number(pin.latitude),
            label: pin.label,
            notes: pin.notes,
            service_location_id: pin.service_location_id
          }));
          setPins(loadedPins);
        }

        // Load service locations
        const { data: locations, error: locationsError } = await supabase
          .from('customer_service_locations')
          .select('*')
          .eq('customer_id', customerId)
          .eq('is_active', true)
          .order('location_name', { ascending: true });

        if (locationsError) {
          console.error('Error loading service locations:', locationsError);
        } else if (locations) {
          setServiceLocations(locations as ServiceLocation[]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (customerId) {
      loadData();
    }
  }, [customerId]);

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
        style: mapStyle,
        center: [-95.7129, 37.0902], // Center of US
        zoom: 4,
        attributionControl: false
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      // Remove the automatic click handler - we'll use controlled pin dropping instead

    } catch (error) {
      console.error('Mapbox initialization error:', error);
      setError('Failed to initialize map');
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Effect to update map style when toggled
  const toggleMapStyle = () => {
    if (!map.current) return; // Add safety check
    
    const newStyle = mapStyle === 'mapbox://styles/mapbox/streets-v12' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12' 
      : 'mapbox://styles/mapbox/streets-v12';
    
    setMapStyle(newStyle);
    
    // Store current markers data before style change
    const currentPins = [...pins];
    
    map.current.setStyle(newStyle);
    
    // Re-add markers after style loads
    map.current.once('style.load', () => {
      // Add safety check before re-adding markers
      if (!map.current) {
        console.error('Map instance lost during style change');
        return;
      }
      
      try {
        // Clear existing marker refs
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};
        
        // Re-add all markers
        currentPins.forEach(pin => {
          if (!map.current) return; // Double check map still exists
          
          const marker = new mapboxgl.Marker({
            color: '#3b82f6',
            draggable: false
          })
            .setLngLat([pin.longitude, pin.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<div style="padding: 4px;"><strong>${pin.label}</strong><br/>Lat: ${pin.latitude.toFixed(6)}<br/>Lng: ${pin.longitude.toFixed(6)}${pin.notes ? '<br/>Notes: ' + pin.notes : ''}</div>`)
            )
            .addTo(map.current);
          
          markersRef.current[pin.id] = marker;
        });
      } catch (error) {
        console.error('Error re-adding markers after style change:', error);
      }
    });
  };

  // Re-add markers when pins or service locations change
  useEffect(() => {
    if (!map.current) return;
    
    const addMarkers = () => {
      if (!map.current) return;
      
      try {
        // Clear existing markers
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};
        Object.values(locationMarkersRef.current).forEach(marker => marker.remove());
        locationMarkersRef.current = {};
        
        // Add pin markers (red)
        pins.forEach(pin => {
          if (!map.current) return;
          
          const marker = new mapboxgl.Marker({
            color: '#ef4444',
            draggable: false
          })
            .setLngLat([pin.longitude, pin.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<div style="padding: 4px;"><strong>${pin.label}</strong><br/>Lat: ${pin.latitude.toFixed(6)}<br/>Lng: ${pin.longitude.toFixed(6)}${pin.notes ? '<br/>Notes: ' + pin.notes : ''}</div>`)
            )
            .addTo(map.current);
          
          markersRef.current[pin.id] = marker;
        });
        
        // Add service location markers (blue with home icon)
        serviceLocations.forEach(location => {
          if (!map.current || !location.gps_coordinates) return;
          
          const coords = location.gps_coordinates;
          let lng, lat;
          
          if ('x' in coords && 'y' in coords) {
            lng = coords.x;
            lat = coords.y;
          }
          
          if (typeof lng === 'number' && typeof lat === 'number' && 
              !isNaN(lng) && !isNaN(lat) && 
              lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            
            const el = document.createElement('div');
            el.className = 'service-location-marker';
            el.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#3b82f6" stroke="#fff" stroke-width="2"/><polyline points="9 22 9 12 15 12 15 22" stroke="#fff" stroke-width="2"/></svg>';
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.cursor = 'pointer';
            
            const fullAddress = [
              location.street,
              location.city,
              location.state,
              location.zip
            ].filter(Boolean).join(', ');
            
            const marker = new mapboxgl.Marker(el)
              .setLngLat([lng, lat])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`<div style="padding: 8px;"><strong>${location.location_name}</strong><br/><span style="font-size: 11px; color: #666;">Physical Address</span><br/>${fullAddress}</div>`)
              )
              .addTo(map.current);
            
            locationMarkersRef.current[location.id] = marker;
          }
        });
      } catch (error) {
        console.error('Error adding markers:', error);
      }
    };
    
    // If map is already loaded, add markers immediately
    if (map.current.loaded()) {
      addMarkers();
    } else {
      // Otherwise wait for load event
      map.current.once('load', addMarkers);
    }
  }, [pins, serviceLocations, mapboxToken]);

  const clearAllPins = async () => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('customer_map_pins')
        .delete()
        .eq('customer_id', customerId);

      if (error) {
        console.error('Error clearing pins from database:', error);
        return;
      }

      // Remove from map
      if (map.current) {
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};
      }
      setPins([]);
    } catch (error) {
      console.error('Error clearing pins:', error);
    }
  };

  const confirmDeletePin = (pin: DropPin) => {
    setDeletingPin(pin);
    setShowDeleteDialog(true);
  };

  const deletePin = async () => {
    if (!deletingPin) return;

    try {
      // Remove from database
      const { error } = await supabase
        .from('customer_map_pins')
        .delete()
        .eq('customer_id', customerId)
        .eq('pin_id', deletingPin.id);

      if (error) {
        console.error('Error deleting pin from database:', error);
        return;
      }

      // Remove from map
      if (markersRef.current[deletingPin.id]) {
        markersRef.current[deletingPin.id].remove();
        delete markersRef.current[deletingPin.id];
      }
      setPins(prev => prev.filter(pin => pin.id !== deletingPin.id));
      
      // Close dialog and reset state
      setShowDeleteDialog(false);
      setDeletingPin(null);
    } catch (error) {
      console.error('Error deleting pin:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setDeletingPin(null);
  };

  const editPin = (pin: DropPin) => {
    setEditingPin(pin);
    setPinName(pin.label);
    setPinNotes(pin.notes || '');
    setSelectedLocationId(pin.service_location_id || '');
    setShowEditDialog(true);
  };

  const toggleDropMode = () => {
    setDropModeActive(!dropModeActive);
  };

  const dropPinAtCenter = () => {
    if (!map.current || !dropModeActive) return;

    const center = map.current.getCenter();
    setPendingPin({ longitude: center.lng, latitude: center.lat });
    setShowNameDialog(true);
  };

  const confirmPinDrop = async () => {
    if (!pendingPin || !map.current) return;

    const newPin: DropPin = {
      id: `pin-${Date.now()}`,
      longitude: pendingPin.longitude,
      latitude: pendingPin.latitude,
      label: pinName || `Pin ${pins.length + 1}`,
      notes: pinNotes,
      service_location_id: selectedLocationId || null
    };

    try {
      // Save to database
      const { error } = await supabase
        .from('customer_map_pins')
        .insert({
          customer_id: customerId,
          pin_id: newPin.id,
          longitude: newPin.longitude,
          latitude: newPin.latitude,
          label: newPin.label,
          notes: newPin.notes,
          service_location_id: newPin.service_location_id
        });

      if (error) {
        console.error('Error saving pin to database:', error);
        return;
      }

      // Add marker to map using default styling
      const marker = new mapboxgl.Marker({
        color: '#3b82f6',
        draggable: false
      })
        .setLngLat([pendingPin.longitude, pendingPin.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div style="padding: 4px;"><strong>${newPin.label}</strong><br/>Lat: ${pendingPin.latitude.toFixed(6)}<br/>Lng: ${pendingPin.longitude.toFixed(6)}${newPin.notes ? '<br/>Notes: ' + newPin.notes : ''}</div>`)
        )
        .addTo(map.current);

      // Track the marker for later deletion
      markersRef.current[newPin.id] = marker;

      setPins(prev => [...prev, newPin]);
      
      // Reset states
      setShowNameDialog(false);
      setPendingPin(null);
      setPinName('');
      setPinNotes('');
      setSelectedLocationId('');
      setDropModeActive(false);
    } catch (error) {
      console.error('Error creating pin:', error);
    }
  };

  const confirmPinEdit = async () => {
    if (!editingPin || !map.current) return;

    const updatedPin = {
      ...editingPin,
      label: pinName,
      notes: pinNotes,
      service_location_id: selectedLocationId || null
    };

    try {
      // Update in database
      const { error } = await supabase
        .from('customer_map_pins')
        .update({
          label: updatedPin.label,
          notes: updatedPin.notes,
          service_location_id: updatedPin.service_location_id
        })
        .eq('customer_id', customerId)
        .eq('pin_id', editingPin.id);

      if (error) {
        console.error('Error updating pin in database:', error);
        return;
      }

      // Update the pin in state
      setPins(prev => prev.map(pin => pin.id === editingPin.id ? updatedPin : pin));

      // Update the popup content for the tracked marker
      if (markersRef.current[editingPin.id]) {
        const marker = markersRef.current[editingPin.id];
        const popup = marker.getPopup();
        if (popup) {
          popup.setHTML(`<div style="padding: 4px;"><strong>${updatedPin.label}</strong><br/>Lat: ${updatedPin.latitude.toFixed(6)}<br/>Lng: ${updatedPin.longitude.toFixed(6)}${updatedPin.notes ? '<br/>Notes: ' + updatedPin.notes : ''}</div>`);
        }
      }

      // Reset states
      setShowEditDialog(false);
      setEditingPin(null);
      setPinName('');
      setPinNotes('');
      setSelectedLocationId('');
    } catch (error) {
      console.error('Error editing pin:', error);
    }
  };

  const cancelPinDrop = () => {
    setShowNameDialog(false);
    setPendingPin(null);
    setPinName('');
    setPinNotes('');
    setSelectedLocationId('');
  };

  const cancelPinEdit = () => {
    setShowEditDialog(false);
    setEditingPin(null);
    setPinName('');
    setPinNotes('');
    setSelectedLocationId('');
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
        if (result.coordinates?.longitude && result.coordinates?.latitude) {
          map.current.flyTo({
            center: [result.coordinates.longitude, result.coordinates.latitude],
            zoom: 16,
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
      <div>
        <div>
          <h3 className="text-lg font-medium text-foreground">Interactive Map</h3>
          <p className="text-sm text-muted-foreground">
            {dropModeActive 
              ? "Drop mode active - use the crosshair to position and drop a pin at map center" 
              : "Select a physical address or paste an address below to navigate. Then activate drop mode to place, label, and save pins."}
          </p>
        </div>
      </div>

      {/* Physical Addresses Dropdown */}
      {serviceLocations.length > 0 && (
        <Select
          value={selectedLocationId}
          onValueChange={(value) => {
            setSelectedLocationId(value);
            // Auto-fill search bar and trigger search
            const location = serviceLocations.find(loc => loc.id === value);
            if (location) {
              const fullAddress = `${location.street}, ${location.city}, ${location.state} ${location.zip || ''}`.trim();
              setSearchQuery(fullAddress);
              
              // Trigger search automatically
              if (map.current) {
                setIsSearching(true);
                supabase.functions.invoke('mapbox-geocoding', {
                  body: { query: fullAddress, limit: 1 }
                }).then(({ data, error: searchError }) => {
                  if (searchError) {
                    console.error('Geocoding error:', searchError);
                    setIsSearching(false);
                    return;
                  }

                  if (data?.suggestions && data.suggestions.length > 0) {
                    const result = data.suggestions[0];
                    if (result.coordinates?.longitude && result.coordinates?.latitude) {
                      map.current?.flyTo({
                        center: [result.coordinates.longitude, result.coordinates.latitude],
                        zoom: 16,
                        duration: 2000
                      });
                    }
                  }
                  setIsSearching(false);
                }).catch(error => {
                  console.error('Search error:', error);
                  setIsSearching(false);
                });
              }
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a physical address to navigate" />
          </SelectTrigger>
          <SelectContent>
            {serviceLocations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.location_name} - {location.street}, {location.city}, {location.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search or paste a physical service address"
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Container - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg overflow-hidden relative">
            <style>{`
              .mapboxgl-ctrl-logo {
                width: 65px !important;
                height: 20px !important;
                margin: 0 0 -4px -4px !important;
              }
              .mapboxgl-ctrl-attrib {
                font-size: 9px !important;
              }
            `}</style>
            {/* Map Style Toggle Switch */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-md border">
                <div className="flex">
                  <button
                    onClick={() => mapStyle !== 'mapbox://styles/mapbox/streets-v12' && toggleMapStyle()}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      mapStyle === 'mapbox://styles/mapbox/streets-v12'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Streets
                  </button>
                  <button
                    onClick={() => mapStyle !== 'mapbox://styles/mapbox/satellite-streets-v12' && toggleMapStyle()}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      mapStyle === 'mapbox://styles/mapbox/satellite-streets-v12'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Satellite
                  </button>
                </div>
              </div>
              
              {/* Activate Drop Mode Button */}
              <Button
                onClick={toggleDropMode}
                size="sm"
                className={`flex items-center gap-2 ${
                  dropModeActive 
                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                {dropModeActive ? "Exit Drop Mode" : "Activate Drop Mode"}
              </Button>
              
              {/* Drop Pin Here Button - shown when drop mode is active */}
              {dropModeActive && (
                <Button
                  onClick={dropPinAtCenter}
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Drop Pin Here
                </Button>
              )}
            </div>
            
            <div 
              ref={mapContainer} 
              className="w-full h-[500px]"
            />
            {dropModeActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-1 h-8 bg-red-500"></div>
                  <div className="w-8 h-1 bg-red-500 absolute"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grouped Pins by Location - Takes 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-muted/50 rounded-lg p-4 h-full max-h-[530px] overflow-y-auto">
            <h4 className="font-medium mb-4">Locations & Pins ({pins.length})</h4>
            <div className="space-y-3">
              {/* Physical Service Locations with their pins */}
              {serviceLocations.map((location) => {
                const locationPins = pins.filter(p => p.service_location_id === location.id);
                const isExpanded = expandedLocations[location.id] !== false;
                
                const handleLocationClick = () => {
                  // Toggle expansion
                  setExpandedLocations(prev => ({ ...prev, [location.id]: !isExpanded }));
                  
                  // Fly to location if it has coordinates
                  if (map.current && location.gps_coordinates) {
                    const coords = location.gps_coordinates;
                    let lng, lat;
                    
                    if ('x' in coords && 'y' in coords) {
                      lng = coords.x;
                      lat = coords.y;
                    }
                    
                    if (typeof lng === 'number' && typeof lat === 'number' && 
                        !isNaN(lng) && !isNaN(lat) && 
                        lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                      map.current.flyTo({
                        center: [lng, lat],
                        zoom: 16,
                        duration: 1500
                      });
                    }
                  }
                };
                
                return (
                  <div key={location.id} className="border rounded-lg bg-background">
                    <button
                      onClick={handleLocationClick}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm break-words">{location.location_name}</div>
                          <div className="text-xs text-muted-foreground break-words">
                            {[location.street, location.city, location.state].filter(Boolean).join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            {locationPins.length} {locationPins.length === 1 ? 'pin' : 'pins'}
                          </span>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>
                    
                    {isExpanded && locationPins.length > 0 && (
                      <div className="border-t p-2 space-y-2">
                        {locationPins.map((pin) => (
                          <div key={pin.id} className="flex items-start justify-between text-sm p-2 bg-muted/30 rounded">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                                {pin.label}
                              </div>
                              <div className="text-muted-foreground font-mono text-xs mt-0.5">
                                {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                              </div>
                              {pin.notes && (
                                <div className="text-muted-foreground text-xs mt-1 line-clamp-1">
                                  {pin.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editPin(pin)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDeletePin(pin)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Unassigned Pins */}
              {pins.filter(p => !p.service_location_id).length > 0 && (
                <div className="border rounded-lg bg-background">
                  <button
                    onClick={() => setExpandedLocations(prev => ({ ...prev, 'unassigned': !prev['unassigned'] }))}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm">Unassigned Pins</span>
                      <span className="text-xs bg-gray-500/10 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {pins.filter(p => !p.service_location_id).length}
                      </span>
                    </div>
                    {expandedLocations['unassigned'] !== false ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  
                  {expandedLocations['unassigned'] !== false && (
                    <div className="border-t p-2 space-y-2">
                      {pins.filter(p => !p.service_location_id).map((pin) => (
                        <div key={pin.id} className="flex items-start justify-between text-sm p-2 bg-muted/30 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs truncate">{pin.label}</div>
                            <div className="text-muted-foreground font-mono text-xs mt-0.5">
                              {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                            </div>
                            {pin.notes && (
                              <div className="text-muted-foreground text-xs mt-1 line-clamp-1">
                                {pin.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editPin(pin)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDeletePin(pin)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {pins.length === 0 && serviceLocations.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
                  <h4 className="font-medium mb-2">No Pins or Locations</h4>
                  <p className="text-sm text-muted-foreground">
                    Add physical addresses or drop pins to see them here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Pin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pin-name">Pin Name</Label>
              <Input
                id="pin-name"
                value={pinName}
                onChange={(e) => setPinName(e.target.value)}
                placeholder="Enter a name for this pin..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    confirmPinDrop();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="pin-location">Assign to Physical Address (Optional)</Label>
              <Select value={selectedLocationId || "none"} onValueChange={(value) => setSelectedLocationId(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="None - Standalone pin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - Standalone pin</SelectItem>
                  {serviceLocations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pin-notes">Inventory Guide / Notes</Label>
              <Textarea
                id="pin-notes"
                value={pinNotes}
                onChange={(e) => setPinNotes(e.target.value)}
                placeholder="Add inventory notes or guidance for this location..."
                rows={3}
              />
            </div>
            {pendingPin && (
              <div className="text-sm text-muted-foreground">
                <p>Coordinates: {pendingPin.latitude.toFixed(6)}, {pendingPin.longitude.toFixed(6)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelPinDrop}>
              Cancel
            </Button>
            <Button onClick={confirmPinDrop}>
              Drop Pin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-pin-name">Pin Name</Label>
              <Input
                id="edit-pin-name"
                value={pinName}
                onChange={(e) => setPinName(e.target.value)}
                placeholder="Enter a name for this pin..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    confirmPinEdit();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="edit-pin-location">Assign to Physical Address (Optional)</Label>
              <Select value={selectedLocationId || "none"} onValueChange={(value) => setSelectedLocationId(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="None - Standalone pin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - Standalone pin</SelectItem>
                  {serviceLocations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-pin-notes">Inventory Guide / Notes</Label>
              <Textarea
                id="edit-pin-notes"
                value={pinNotes}
                onChange={(e) => setPinNotes(e.target.value)}
                placeholder="Add inventory notes or guidance for this location..."
                rows={3}
              />
            </div>
            {editingPin && (
              <div className="text-sm text-muted-foreground">
                <p>Coordinates: {editingPin.latitude.toFixed(6)}, {editingPin.longitude.toFixed(6)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelPinEdit}>
              Cancel
            </Button>
            <Button onClick={confirmPinEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this pin? This action cannot be undone.
            </p>
            {deletingPin && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="font-medium text-sm">{deletingPin.label}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  {deletingPin.latitude.toFixed(6)}, {deletingPin.longitude.toFixed(6)}
                </div>
                {deletingPin.notes && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Notes: {deletingPin.notes}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deletePin}>
              Delete Pin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function ServiceLocationTab({ customerId }: ServiceLocationTabProps) {
  const [activeTab, setActiveTab] = useState('addresses');

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Service Locations</h3>
        
        {/* Toggle Switch for Service Locations */}
        <div className="mb-6 flex">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                activeTab === 'addresses'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Physical Addresses
            </button>
            <button
              onClick={() => setActiveTab('pins')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                activeTab === 'pins'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Navigation className="w-4 h-4" />
              Drop Map Pins
            </button>
          </div>
        </div>
        
        {/* Active Tab Content */}
        <div className="mt-6">
          {activeTab === 'addresses' ? (
            <ServiceAddressesSection customerId={customerId} />
          ) : (
            <DropMapPinsSection customerId={customerId} />
          )}
        </div>
      </div>
    </div>
  );
}
