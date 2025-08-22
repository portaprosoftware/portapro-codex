import React, { useState, useEffect } from 'react';
import { MapPin, Building, Phone, User, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

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
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
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

  const getCustomAddress = () => {
    if (state.data.special_instructions?.startsWith('Address: ')) {
      return state.data.special_instructions.replace('Address: ', '');
    }
    return null;
  };

  // Auto-select default location when locations are loaded
  useEffect(() => {
    if (serviceLocations.length > 0 && state.data.selected_coordinate_ids.length === 0) {
      const defaultLocation = serviceLocations.find(location => location.is_default);
      if (defaultLocation) {
        handleLocationSelect(defaultLocation);
      }
    }
  }, [serviceLocations, state.data.selected_coordinate_ids.length]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Service Location</h2>
        <p className="text-muted-foreground">
          Select where the job will be performed. Choose from existing locations or enter a temporary address.
        </p>
      </div>

      {/* Existing Locations */}
      {serviceLocations.length > 0 ? (
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
                          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0 text-xs px-2 py-1 rounded">
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
      ) : (
        <div className="text-center py-8">
          <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No saved locations available. Create service locations in the Customer section first.
          </p>
        </div>
      )}

      {/* Collapsible Address Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            or enter new address manually (if needed for unique one-off job)
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddressFormOpen(!isAddressFormOpen)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            {isAddressFormOpen ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide form
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show form
              </>
            )}
          </Button>
        </div>
        
        {isAddressFormOpen && (
          <Card className="bg-muted/20">
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
                  <Select
                    value={newLocation.state}
                    onValueChange={(value) => setNewLocation(prev => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        )}
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
                <div className="space-y-1">
                  <p className="font-medium">Custom Address:</p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {getCustomAddress() || 'New address location'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
