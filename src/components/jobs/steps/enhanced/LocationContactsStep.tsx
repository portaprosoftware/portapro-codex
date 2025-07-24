import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Search, Users, Plus, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceLocation {
  id: string;
  location_name: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
  gps_coordinates?: any;
  access_instructions?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  contact_type: string;
  is_primary: boolean;
}

interface LocationContactsData {
  customerId: string | null;
  selectedLocationId: string | null;
  newLocationData: {
    address: string;
    coordinates: { lat: number; lng: number } | null;
    saveToProfile: boolean;
  } | null;
  selectedContactIds: string[];
  specialInstructions: string;
}

interface LocationContactsStepProps {
  data: LocationContactsData;
  onUpdate: (data: LocationContactsData) => void;
}

export const LocationContactsStep: React.FC<LocationContactsStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationMode, setLocationMode] = useState<'saved' | 'new'>('saved');

  useEffect(() => {
    if (data.customerId) {
      fetchCustomerData();
    }
  }, [data.customerId]);

  const fetchCustomerData = async () => {
    if (!data.customerId) return;

    try {
      // Fetch service locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', data.customerId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (locationsError) throw locationsError;

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', data.customerId)
        .order('is_primary', { ascending: false });

      if (contactsError) throw contactsError;

      setServiceLocations(locationsData || []);
      setContacts(contactsData || []);

      // Auto-select default location if available and none selected
      if (!data.selectedLocationId && locationsData?.length > 0) {
        const defaultLocation = locationsData.find(loc => loc.is_default) || locationsData[0];
        onUpdate({ ...data, selectedLocationId: defaultLocation.id });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    onUpdate({
      ...data,
      selectedLocationId: locationId,
      newLocationData: null
    });
    setLocationMode('saved');
  };

  const handleNewLocationUpdate = (field: string, value: any) => {
    onUpdate({
      ...data,
      selectedLocationId: null,
      newLocationData: {
        ...data.newLocationData,
        address: data.newLocationData?.address || '',
        coordinates: data.newLocationData?.coordinates || null,
        saveToProfile: data.newLocationData?.saveToProfile || false,
        [field]: value
      }
    });
    setLocationMode('new');
  };

  const handleContactToggle = (contactId: string, checked: boolean) => {
    const updatedContactIds = checked
      ? [...data.selectedContactIds, contactId]
      : data.selectedContactIds.filter(id => id !== contactId);

    onUpdate({ ...data, selectedContactIds: updatedContactIds });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleNewLocationUpdate('coordinates', { lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const getSelectedLocation = () => {
    if (data.selectedLocationId) {
      return serviceLocations.find(loc => loc.id === data.selectedLocationId);
    }
    return null;
  };

  const getSelectedContacts = () => {
    return contacts.filter(contact => data.selectedContactIds.includes(contact.id));
  };

  const formatAddress = (location: ServiceLocation) => {
    const parts = [
      location.street,
      location.street2,
      location.city,
      location.state && location.zip ? `${location.state} ${location.zip}` : location.state || location.zip
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Location & Contacts</h2>
          <p className="text-muted-foreground">Loading customer information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Location & Contacts</h2>
        <p className="text-muted-foreground">Select the job location and contacts to notify</p>
      </div>

      {/* Job Location Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Job Location</Label>
        
        {serviceLocations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <Button
                variant={locationMode === 'saved' ? 'default' : 'outline'}
                onClick={() => setLocationMode('saved')}
                size="sm"
              >
                Saved Addresses
              </Button>
              <Button
                variant={locationMode === 'new' ? 'default' : 'outline'}
                onClick={() => setLocationMode('new')}
                size="sm"
              >
                New Location
              </Button>
            </div>

            {locationMode === 'saved' && (
              <Select value={data.selectedLocationId || ''} onValueChange={handleLocationSelect}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a saved location">
                    {getSelectedLocation() && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{getSelectedLocation()?.location_name}</span>
                        {getSelectedLocation()?.is_default && (
                          <Badge className="bg-green-100 text-green-800">Default</Badge>
                        )}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {serviceLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{location.location_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatAddress(location)}
                          </div>
                        </div>
                        {location.is_default && (
                          <Badge className="ml-2 bg-green-100 text-green-800">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {(locationMode === 'new' || serviceLocations.length === 0) && (
          <div className="space-y-4 border border-border rounded-lg p-4">
            <div className="space-y-3">
              <Label htmlFor="new-address">Service Address</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="new-address"
                  placeholder="Enter service address..."
                  value={data.newLocationData?.address || ''}
                  onChange={(e) => handleNewLocationUpdate('address', e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGetCurrentLocation}
              className="w-full h-12 border-dashed border-2"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>

            {data.newLocationData?.coordinates && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    GPS Coordinates Set
                  </span>
                </div>
                <div className="text-xs text-green-700">
                  Lat: {data.newLocationData.coordinates.lat.toFixed(6)}, 
                  Lng: {data.newLocationData.coordinates.lng.toFixed(6)}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-location"
                checked={data.newLocationData?.saveToProfile || false}
                onCheckedChange={(checked) => handleNewLocationUpdate('saveToProfile', checked)}
              />
              <Label htmlFor="save-location" className="text-sm">
                Save this location to customer profile
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Contacts Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Contacts to Notify</Label>
        
        {contacts.length > 0 ? (
          <div className="grid gap-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center space-x-3 p-3 border border-border rounded-lg"
              >
                <Checkbox
                  id={`contact-${contact.id}`}
                  checked={data.selectedContactIds.includes(contact.id)}
                  onCheckedChange={(checked) => 
                    handleContactToggle(contact.id, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Label 
                      htmlFor={`contact-${contact.id}`} 
                      className="font-medium cursor-pointer"
                    >
                      {contact.first_name} {contact.last_name}
                    </Label>
                    {contact.is_primary && (
                      <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {contact.contact_type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    {contact.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No contacts found for this customer</p>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      <div className="space-y-3">
        <Label htmlFor="instructions">Special Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Any special instructions for the driver? (gate codes, access notes, etc.)"
          value={data.specialInstructions}
          onChange={(e) => onUpdate({ ...data, specialInstructions: e.target.value })}
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Summary */}
      {(getSelectedLocation() || data.newLocationData?.address) && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Job Location Summary
            </span>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Location:</span>{' '}
              <span className="text-sm">
                {getSelectedLocation() 
                  ? `${getSelectedLocation()?.location_name} - ${formatAddress(getSelectedLocation()!)}`
                  : data.newLocationData?.address
                }
              </span>
            </div>
            
            {getSelectedContacts().length > 0 && (
              <div>
                <span className="text-sm font-medium">Contacts:</span>{' '}
                <span className="text-sm">
                  {getSelectedContacts().map(c => `${c.first_name} ${c.last_name}`).join(', ')}
                </span>
              </div>
            )}
            
            {data.specialInstructions && (
              <div>
                <span className="text-sm font-medium">Instructions:</span>{' '}
                <span className="text-sm">{data.specialInstructions}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};