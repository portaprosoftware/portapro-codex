
import React, { useState, useEffect, useRef } from 'react';
import { ServiceAddressesSection } from './ServiceAddressesSection';
import { MapPin, Navigation, Trash2, Search, Target, Plus, Edit2, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
}

const DropMapPinsSection = ({ customerId }: { customerId: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState('');
  const [pins, setPins] = useState<DropPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dropModeActive, setDropModeActive] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPin, setEditingPin] = useState<DropPin | null>(null);
  const [pendingPin, setPendingPin] = useState<{ longitude: number; latitude: number } | null>(null);
  const [pinName, setPinName] = useState('');
  const [pinNotes, setPinNotes] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');

  // Load existing pins from database
  useEffect(() => {
    const loadExistingPins = async () => {
      try {
        const { data: existingPins, error } = await supabase
          .from('customer_map_pins')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading existing pins:', error);
          return;
        }

        if (existingPins && existingPins.length > 0) {
          const loadedPins: DropPin[] = existingPins.map(pin => ({
            id: pin.pin_id,
            longitude: Number(pin.longitude),
            latitude: Number(pin.latitude),
            label: pin.label,
            notes: pin.notes
          }));
          
          setPins(loadedPins);
        }
      } catch (error) {
        console.error('Error loading pins:', error);
      }
    };

    if (customerId) {
      loadExistingPins();
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
        zoom: 4
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Remove the automatic click handler - we'll use controlled pin dropping instead

    } catch (error) {
      console.error('Mapbox initialization error:', error);
      setError('Failed to initialize map');
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, mapStyle]);

  // Effect to update map style when toggled
  const toggleMapStyle = () => {
    const newStyle = mapStyle === 'mapbox://styles/mapbox/streets-v12' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12' 
      : 'mapbox://styles/mapbox/streets-v12';
    
    setMapStyle(newStyle);
    
    if (map.current) {
      // Store current markers data before style change
      const currentPins = [...pins];
      
      map.current.setStyle(newStyle);
      
      // Re-add markers after style loads
      map.current.once('style.load', () => {
        // Clear existing marker refs
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};
        
        // Re-add all markers
        currentPins.forEach(pin => {
          const marker = new mapboxgl.Marker({
            color: '#3b82f6',
            draggable: false
          })
            .setLngLat([pin.longitude, pin.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<div style="padding: 4px;"><strong>${pin.label}</strong><br/>Lat: ${pin.latitude.toFixed(6)}<br/>Lng: ${pin.longitude.toFixed(6)}${pin.notes ? '<br/>Notes: ' + pin.notes : ''}</div>`)
            )
            .addTo(map.current!);
          
          markersRef.current[pin.id] = marker;
        });
      });
    }
  };

  // Re-add markers when pins are loaded from database
  useEffect(() => {
    if (pins.length > 0 && map.current && Object.keys(markersRef.current).length === 0) {
      pins.forEach(pin => {
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
    }
  }, [pins, mapboxToken]);

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

  const deletePin = async (pinId: string) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('customer_map_pins')
        .delete()
        .eq('customer_id', customerId)
        .eq('pin_id', pinId);

      if (error) {
        console.error('Error deleting pin from database:', error);
        return;
      }

      // Remove from map
      if (markersRef.current[pinId]) {
        markersRef.current[pinId].remove();
        delete markersRef.current[pinId];
      }
      setPins(prev => prev.filter(pin => pin.id !== pinId));
    } catch (error) {
      console.error('Error deleting pin:', error);
    }
  };

  const editPin = (pin: DropPin) => {
    setEditingPin(pin);
    setPinName(pin.label);
    setPinNotes(pin.notes || '');
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
      notes: pinNotes
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
          notes: newPin.notes
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
      notes: pinNotes
    };

    try {
      // Update in database
      const { error } = await supabase
        .from('customer_map_pins')
        .update({
          label: updatedPin.label,
          notes: updatedPin.notes
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
    } catch (error) {
      console.error('Error editing pin:', error);
    }
  };

  const cancelPinDrop = () => {
    setShowNameDialog(false);
    setPendingPin(null);
    setPinName('');
    setPinNotes('');
  };

  const cancelPinEdit = () => {
    setShowEditDialog(false);
    setEditingPin(null);
    setPinName('');
    setPinNotes('');
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
              : "Paste a physical address below to navigate. Then activate drop mode to place, label, and save pins."}
          </p>
        </div>
      </div>

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
            variant={dropModeActive ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2 bg-background/90 backdrop-blur-sm"
          >
            <Target className="w-4 h-4" />
            {dropModeActive ? "Exit Drop Mode" : "Activate Drop Mode"}
          </Button>
        </div>
        
        <div 
          ref={mapContainer} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
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

      {dropModeActive && (
        <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
          <Button
            onClick={dropPinAtCenter}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Drop Pin Here
          </Button>
        </div>
      )}
      
      {pins.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Dropped Pins ({pins.length})</h4>
          <div className="grid gap-2 max-h-32 overflow-y-auto">
            {pins.map((pin) => (
              <div key={pin.id} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                <div className="flex-1">
                  <div className="font-medium">{pin.label}</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                  </div>
                  {pin.notes && (
                    <div className="text-muted-foreground text-xs mt-1">
                      Notes: {pin.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editPin(pin)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePin(pin.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
