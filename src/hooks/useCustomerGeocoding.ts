import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

interface CustomerGeocodeHook {
  isGeocoding: boolean;
  geocodeCustomerLocation: (customerId: string, address: string) => Promise<GeocodeResult | null>;
  batchGeocodeExistingLocations: () => Promise<void>;
}

export const useCustomerGeocoding = (): CustomerGeocodeHook => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('mapbox-geocoding', {
        body: { q: address, limit: '1' }
      });

      if (error) {
        console.error('Geocoding error:', error);
        return null;
      }

      if (data?.suggestions && data.suggestions.length > 0) {
        const suggestion = data.suggestions[0];
        return {
          latitude: suggestion.coordinates.latitude,
          longitude: suggestion.coordinates.longitude
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding request failed:', error);
      return null;
    }
  };

  const geocodeCustomerLocation = async (customerId: string, address: string): Promise<GeocodeResult | null> => {
    setIsGeocoding(true);
    
    try {
      const result = await geocodeAddress(address);
      
      if (result) {
        // Update the service location with GPS coordinates
        const { error } = await supabase
          .from('customer_service_locations')
          .update({
            gps_coordinates: `POINT(${result.longitude} ${result.latitude})`
          })
          .eq('customer_id', customerId)
          .eq('is_default', true);

        if (error) {
          console.error('Failed to update GPS coordinates:', error);
          toast({
            title: "Warning",
            description: "Customer created but GPS coordinates could not be saved.",
            variant: "destructive"
          });
        } else {
          console.log(`Updated GPS coordinates for customer ${customerId}: ${result.latitude}, ${result.longitude}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const batchGeocodeExistingLocations = async (): Promise<void> => {
    setIsGeocoding(true);

    try {
      // Get locations that need geocoding
      const { data: locations, error: fetchError } = await supabase
        .from('customer_service_locations')
        .select('id, street, street2, city, state, zip, location_name')
        .is('gps_coordinates', null)
        .not('street', 'is', null)
        .not('city', 'is', null)
        .not('state', 'is', null);

      if (fetchError) {
        throw fetchError;
      }

      if (!locations || locations.length === 0) {
        toast({
          title: "No locations to geocode",
          description: "All service locations already have GPS coordinates."
        });
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      // Process locations in batches to avoid rate limiting
      for (const location of locations) {
        const fullAddress = [
          location.street,
          location.street2,
          location.city,
          location.state,
          location.zip
        ].filter(Boolean).join(' ');

        const result = await geocodeAddress(fullAddress);

        if (result) {
          const { error } = await supabase
            .from('customer_service_locations')
            .update({
              gps_coordinates: `POINT(${result.longitude} ${result.latitude})`
            })
            .eq('id', location.id);

          if (!error) {
            successCount++;
            console.log(`Geocoded ${location.location_name}: ${result.latitude}, ${result.longitude}`);
          } else {
            failureCount++;
            console.error(`Failed to update ${location.location_name}:`, error);
          }
        } else {
          failureCount++;
          console.log(`Could not geocode ${location.location_name}: ${fullAddress}`);
        }

        // Add a small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "Batch geocoding complete",
        description: `Successfully geocoded ${successCount} locations. ${failureCount} failed.`,
        variant: successCount > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Batch geocoding failed:', error);
      toast({
        title: "Batch geocoding failed",
        description: "Could not complete batch geocoding process.",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  return {
    isGeocoding,
    geocodeCustomerLocation,
    batchGeocodeExistingLocations
  };
};