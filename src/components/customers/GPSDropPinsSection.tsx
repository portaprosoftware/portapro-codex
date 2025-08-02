import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddPinModal } from './AddPinModal';
import { PinsList } from './PinsList';
import { PinInventoryModal } from './PinInventoryModal';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface GPSDropPinsSectionProps {
  customerId: string;
}

export function GPSDropPinsSection({ customerId }: GPSDropPinsSectionProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<any>(null);

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
      return data;
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
      return data;
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
    setIsAddModalOpen(false);
    toast.success('GPS pin added successfully');
  };

  const handlePinDeleted = () => {
    refetchPins();
    toast.success('GPS pin deleted successfully');
  };

  const handleAssignInventory = (pin: any) => {
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
      <div className="bg-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">GPS Drop-Pins</h3>
            <p className="text-sm text-muted-foreground">
              Add GPS coordinates tied to specific service locations
            </p>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={!selectedLocationId}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Drop-Pin
          </Button>
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

        <PinsList 
          pins={pins || []} 
          isLoading={pinsLoading}
          onPinDeleted={handlePinDeleted}
          onAssignInventory={handleAssignInventory}
        />
      </div>

      {selectedLocation && (
        <AddPinModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          serviceLocation={selectedLocation}
          onPinAdded={handlePinAdded}
        />
      )}

      {isInventoryModalOpen && selectedPin && (
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