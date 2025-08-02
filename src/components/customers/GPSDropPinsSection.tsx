import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddPinSlider } from './AddPinSlider';
import { PinsList } from './PinsList';
import { PinInventoryModal } from './PinInventoryModal';
import { MapView } from './MapView';
import { PinsMapSlider } from './PinsMapSlider';
import { MapPin, Plus, Map } from 'lucide-react';
import { toast } from 'sonner';

interface GPSDropPinsSectionProps {
  customerId: string;
}

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
  is_default: boolean;
}

export function GPSDropPinsSection({ customerId }: GPSDropPinsSectionProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isAddSliderOpen, setIsAddSliderOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isMapSliderOpen, setIsMapSliderOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  // Fetch service locations for this customer
  const { data: serviceLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['customer-service-locations', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as ServiceLocation[];
    },
  });

  // Fetch GPS pins for selected location
  const { data: pins, isLoading: pinsLoading, refetch: refetchPins } = useQuery({
    queryKey: ['service-location-coordinates', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return [];
      
      const { data, error } = await supabase
        .from('service_location_coordinates')
        .select('*')
        .eq('service_location_id', selectedLocationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pin[];
    },
    enabled: !!selectedLocationId,
  });

  // Set default location when data loads
  React.useEffect(() => {
    if (serviceLocations && serviceLocations.length > 0 && !selectedLocationId) {
      const defaultLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
      setSelectedLocationId(defaultLocation.id);
    }
  }, [serviceLocations, selectedLocationId]);

  const handlePinAdded = () => {
    refetchPins();
    setIsAddSliderOpen(false);
    toast.success('GPS pin added successfully');
  };

  const handlePinDeleted = () => {
    refetchPins();
    toast.success('GPS pin deleted successfully');
  };

  const handleAssignInventory = (pin: Pin) => {
    setSelectedPin(pin);
    setIsInventoryModalOpen(true);
  };

  const handleMapPinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setIsInventoryModalOpen(true);
  };

  const handleInventoryUpdated = () => {
    refetchPins();
  };

  if (locationsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!serviceLocations || serviceLocations.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">No service locations found</p>
        <p className="text-sm text-muted-foreground">
          Add a physical address first in the "Physical Addresses" tab
        </p>
      </div>
    );
  }

  const selectedLocation = serviceLocations.find(loc => loc.id === selectedLocationId);

  return (
    <div className="space-y-6">
      {/* Header with Location Selector */}
      <div className="bg-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">GPS Drop-Pins</h3>
            <p className="text-sm text-muted-foreground">
              Add GPS coordinates tied to specific service locations
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Service Location</label>
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a service location" />
            </SelectTrigger>
            <SelectContent>
              {serviceLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center gap-2">
                    {location.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                    {location.location_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLocationId && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button 
                onClick={() => setIsAddSliderOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Drop-Pin
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsMapSliderOpen(true)}
                className="flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Enlarge Map
              </Button>
            </div>

            {/* Split View Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
              {/* Left Pane - Pins List */}
              <div className="bg-muted/20 border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b bg-muted/50">
                  <h4 className="font-medium text-sm">Saved Pins</h4>
                  <p className="text-xs text-muted-foreground">
                    {pins?.length || 0} pin{pins?.length !== 1 ? 's' : ''} at this location
                  </p>
                </div>
                <div className="h-[calc(100%-60px)] overflow-auto">
                  <PinsList 
                    pins={pins || []} 
                    isLoading={pinsLoading}
                    onPinDeleted={handlePinDeleted}
                    onAssignInventory={handleAssignInventory}
                  />
                </div>
              </div>

              {/* Right Pane - Map */}
              <div className="bg-muted/20 border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b bg-muted/50">
                  <h4 className="font-medium text-sm">Location Map</h4>
                  <p className="text-xs text-muted-foreground">
                    Click pins to manage inventory
                  </p>
                </div>
                <div className="h-[calc(100%-60px)]">
                  <MapView 
                    pins={pins || []}
                    selectedLocation={selectedLocation}
                    onPinClick={handleMapPinClick}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sliders and Modals */}
      {selectedLocation && (
        <AddPinSlider
          isOpen={isAddSliderOpen}
          onClose={() => setIsAddSliderOpen(false)}
          serviceLocation={selectedLocation}
          onPinAdded={handlePinAdded}
        />
      )}

      <PinsMapSlider
        isOpen={isMapSliderOpen}
        onClose={() => setIsMapSliderOpen(false)}
        pins={pins || []}
        selectedLocation={selectedLocation}
        onPinClick={handleMapPinClick}
      />

      {selectedPin && (
        <PinInventoryModal
          isOpen={isInventoryModalOpen}
          onOpenChange={setIsInventoryModalOpen}
          coordinateId={selectedPin.id}
          pinName={selectedPin.point_name}
          onInventoryUpdated={handleInventoryUpdated}
        />
      )}
    </div>
  );
}