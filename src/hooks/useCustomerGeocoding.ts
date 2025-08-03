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
      console.log('Geocoding address:', address);
      
      const { data, error } = await supabase.functions.invoke('mapbox-geocoding', {
        body: { q: address, limit: '1' }
      });

      console.log('Geocoding response:', data, error);

      if (error) {
        console.error('Geocoding error:', error);
        return null;
      }

      if (data?.suggestions && data.suggestions.length > 0) {
        const suggestion = data.suggestions[0];
        console.log('Using geocoding result:', suggestion);
        return {
          latitude: suggestion.coordinates.latitude,
          longitude: suggestion.coordinates.longitude
        };
      }

      console.log('No geocoding results found');
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
        // Update the service location with GPS coordinates and success status
        const { error } = await supabase
          .from('customer_service_locations')
          .update({
            gps_coordinates: `POINT(${result.longitude} ${result.latitude})`,
            geocoding_status: 'completed',
            geocoding_attempted_at: new Date().toISOString()
          })
          .eq('customer_id', customerId);

        if (error) {
          console.error('Failed to update GPS coordinates:', error);
          // Update status to failed
          await supabase
            .from('customer_service_locations')
            .update({
              geocoding_status: 'failed',
              geocoding_attempted_at: new Date().toISOString()
            })
            .eq('customer_id', customerId);
          
          toast({
            title: "Warning",
            description: "Customer created but GPS coordinates could not be saved.",
            variant: "destructive"
          });
        } else {
          console.log(`Updated GPS coordinates for customer ${customerId}: ${result.latitude}, ${result.longitude}`);
          toast({
            title: "GPS Added",
            description: "Location coordinates have been added successfully.",
          });
        }
      } else {
        // Update status to failed if geocoding returned no results
        await supabase
          .from('customer_service_locations')
          .update({
            geocoding_status: 'failed',
            geocoding_attempted_at: new Date().toISOString()
          })
          .eq('customer_id', customerId);
      }

      return result;
    } catch (error) {
      console.error('Geocoding failed:', error);
      // Update status to failed on exception
      await supabase
        .from('customer_service_locations')
        .update({
          geocoding_status: 'failed',
          geocoding_attempted_at: new Date().toISOString()
        })
        .eq('customer_id', customerId);
      
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const batchGeocodeExistingLocations = async (): Promise<void> => {
    setIsGeocoding(true);

    try {
      // Get locations that need geocoding (only those with pending status)
      const { data: locations, error: fetchError } = await supabase
        .from('customer_service_locations')
        .select('id, street, street2, city, state, zip, location_name')
        .is('gps_coordinates', null)
        .not('street', 'is', null)
        .not('city', 'is', null)
        .not('state', 'is', null)
        .in('geocoding_status', ['pending', 'failed']); // Include failed ones for retry

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
              gps_coordinates: `POINT(${result.longitude} ${result.latitude})`,
              geocoding_status: 'completed',
              geocoding_attempted_at: new Date().toISOString()
            })
            .eq('id', location.id);

          if (!error) {
            successCount++;
            console.log(`Geocoded ${location.location_name}: ${result.latitude}, ${result.longitude}`);
          } else {
            failureCount++;
            console.error(`Failed to update ${location.location_name}:`, error);
            // Mark as failed
            await supabase
              .from('customer_service_locations')
              .update({
                geocoding_status: 'failed',
                geocoding_attempted_at: new Date().toISOString()
              })
              .eq('id', location.id);
          }
        } else {
          failureCount++;
          console.log(`Could not geocode ${location.location_name}: ${fullAddress}`);
          // Mark as failed
          await supabase
            .from('customer_service_locations')
            .update({
              geocoding_status: 'failed',
              geocoding_attempted_at: new Date().toISOString()
            })
            .eq('id', location.id);
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