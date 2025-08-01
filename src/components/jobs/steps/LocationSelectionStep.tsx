import React, { useState } from 'react';
import { MapPin, Plus, Building, Phone, User, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface ServiceLocation {
  id: string;
  location_name: string;
  location_description?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  contact_person?: string;
  contact_phone?: string;
  access_instructions?: string;
  is_default: boolean;
}

export function LocationSelectionStep() {
  const { state, updateData } = useJobWizard();
  const [newLocation, setNewLocation] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const { data: serviceLocations = [], isLoading } = useQuery({
    queryKey: ['customerServiceLocations', state.data.customer_id],
    queryFn: async () => {
      if (!state.data.customer_id) return [];
      
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', state.data.customer_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as ServiceLocation[];
    },
    enabled: !!state.data.customer_id,
  });

  const handleLocationSelect = (location: ServiceLocation) => {
    updateData({
      selected_coordinate_ids: [location.id],
    });
  };

  const handleAddressChange = (addressData: { street: string; city: string; state: string; zip: string; coordinates?: { longitude: number; latitude: number } }) => {
    setNewLocation(prev => ({
      ...prev,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip,
    }));
  };

  const handleCreateLocation = () => {
    // Store address data in special_instructions for now
    const addressText = `${newLocation.street}, ${newLocation.city}, ${newLocation.state} ${newLocation.zip}`;
    
    updateData({
      selected_coordinate_ids: ['new'],
      special_instructions: `Address: ${addressText}`,
    });
  };

  const isNewLocationValid = () => {
    return newLocation.street && newLocation.city && newLocation.state && newLocation.zip;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Service Location</h2>
        <p className="text-muted-foreground">
          Select where the job will be performed. Choose from existing locations or enter a temporary address.
        </p>
      </div>

      {/* Existing Locations */}
      {serviceLocations.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-medium">Saved Locations</Label>
          <div className="space-y-3">
            {serviceLocations.map((location) => (
              <Card
                key={location.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  state.data.selected_coordinate_ids.includes(location.id) && "ring-2 ring-primary bg-primary/5"
                )}
                onClick={() => handleLocationSelect(location)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{location.location_name}</h3>
                        {location.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {location.street && (
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3" />
                            {location.street}
                            {location.street2 && `, ${location.street2}`}
                          </div>
                        )}
                        {location.city && (
                          <p className="ml-5">
                            {location.city}, {location.state} {location.zip}
                          </p>
                        )}
                        {location.contact_person && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {location.contact_person}
                            {location.contact_phone && ` - ${location.contact_phone}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {state.data.selected_coordinate_ids.includes(location.id) && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                        <MapPin className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Simple Address Input */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Or Enter Address</Label>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Street Address</Label>
              <Input
                placeholder="Enter street address"
                value={newLocation.street}
                onChange={(e) => setNewLocation(prev => ({ ...prev, street: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={newLocation.city}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={newLocation.state}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  value={newLocation.zip}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, zip: e.target.value }))}
                />
              </div>
            </div>

            <Button
              onClick={handleCreateLocation}
              disabled={!isNewLocationValid()}
              className="w-full"
            >
              Use This Address
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Special Instructions */}
      {state.data.selected_coordinate_ids.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-medium">Special Instructions (Optional)</Label>
          <Textarea
            placeholder="Any special instructions for the crew at this location..."
            value={state.data.special_instructions || ''}
            onChange={(e) => updateData({ special_instructions: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {/* Validation Errors */}
      {state.errors.location && (
        <p className="text-sm text-destructive">{state.errors.location}</p>
      )}
      
      {state.errors.street && (
        <p className="text-sm text-destructive">{state.errors.street}</p>
      )}
      
      {state.errors.city && (
        <p className="text-sm text-destructive">{state.errors.city}</p>
      )}

      {/* Summary */}
      {state.data.selected_coordinate_ids.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Selected Location
            </h3>
            <div className="text-sm">
              {state.data.selected_coordinate_ids.length > 0 && state.data.selected_coordinate_ids[0] !== 'new' && (
                <p>Using saved location: {serviceLocations.find(l => l.id === state.data.selected_coordinate_ids[0])?.location_name}</p>
              )}
              {state.data.selected_coordinate_ids.includes('new') && (
                <p>New address location</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
