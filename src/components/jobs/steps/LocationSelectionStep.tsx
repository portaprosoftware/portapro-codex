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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    locationName: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    contactPerson: '',
    contactPhone: '',
    accessInstructions: '',
    saveToProfile: true,
  });

  const { data: serviceLocations = [], isLoading } = useQuery({
    queryKey: ['customerServiceLocations', state.data.customerId],
    queryFn: async () => {
      if (!state.data.customerId) return [];
      
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', state.data.customerId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as ServiceLocation[];
    },
    enabled: !!state.data.customerId,
  });

  const handleLocationSelect = (location: ServiceLocation) => {
    updateData({
      serviceLocationId: location.id,
      newLocationData: undefined,
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
    const locationData = {
      street: newLocation.street,
      city: newLocation.city,
      state: newLocation.state,
      zip: newLocation.zip,
      saveToProfile: newLocation.saveToProfile,
    };

    updateData({
      serviceLocationId: undefined,
      newLocationData: locationData,
      specialInstructions: newLocation.accessInstructions,
    });

    setShowCreateForm(false);
  };

  const isNewLocationValid = () => {
    return newLocation.street && newLocation.city && newLocation.state && newLocation.zip;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Service Location</h2>
        <p className="text-muted-foreground">
          Select where the job will be performed. You can choose from existing locations or create a new one.
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
                  state.data.serviceLocationId === location.id && "ring-2 ring-primary bg-primary/5"
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
                    
                    {state.data.serviceLocationId === location.id && (
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

      {/* Create New Location */}
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Location
        </Button>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Location Name</Label>
                <Input
                  placeholder="e.g., Main Office, Construction Site A"
                  value={newLocation.locationName}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, locationName: e.target.value }))}
                />
              </div>

              <div>
                <Label>Address</Label>
                <AddressAutocomplete
                  value={undefined}
                  onChange={handleAddressChange}
                  placeholder="Enter street address"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label>ZIP Code</Label>
                <Input
                  value={newLocation.zip}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, zip: e.target.value }))}
                  className="w-32"
                />
              </div>

              <div>
                <Label>Contact Person (Optional)</Label>
                <Input
                  placeholder="On-site contact name"
                  value={newLocation.contactPerson}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, contactPerson: e.target.value }))}
                />
              </div>

              <div>
                <Label>Contact Phone (Optional)</Label>
                <Input
                  placeholder="Contact phone number"
                  value={newLocation.contactPhone}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>

              <div>
                <Label>Access Instructions (Optional)</Label>
                <Textarea
                  placeholder="Gate codes, parking instructions, etc."
                  value={newLocation.accessInstructions}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, accessInstructions: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newLocation.saveToProfile}
                  onCheckedChange={(checked) => setNewLocation(prev => ({ ...prev, saveToProfile: checked }))}
                />
                <Label className="text-sm">Save this location to customer profile</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateLocation}
                  disabled={!isNewLocationValid()}
                  className="flex-1"
                >
                  Use This Location
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Special Instructions */}
      {(state.data.serviceLocationId || state.data.newLocationData) && (
        <div className="space-y-4">
          <Label className="text-base font-medium">Special Instructions (Optional)</Label>
          <Textarea
            placeholder="Any special instructions for the crew at this location..."
            value={state.data.specialInstructions || ''}
            onChange={(e) => updateData({ specialInstructions: e.target.value })}
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
      {(state.data.serviceLocationId || state.data.newLocationData) && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Selected Location
            </h3>
            <div className="text-sm">
              {state.data.serviceLocationId ? (
                <p>Using saved location: {serviceLocations.find(l => l.id === state.data.serviceLocationId)?.location_name}</p>
              ) : (
                <div className="space-y-1">
                  <p>{state.data.newLocationData?.street}</p>
                  <p>{state.data.newLocationData?.city}, {state.data.newLocationData?.state} {state.data.newLocationData?.zip}</p>
                  {state.data.newLocationData?.saveToProfile && (
                    <p className="text-muted-foreground">Will be saved to customer profile</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
