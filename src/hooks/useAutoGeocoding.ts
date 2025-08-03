import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { geocodeAddress } from '@/utils/geocoding';

export function useAutoGeocoding() {
  useEffect(() => {
    const geocodeExistingLocations = async () => {
      try {
        // Get service locations without GPS coordinates
        const { data: locationsNeedingGeocoding, error } = await supabase
          .from('customer_service_locations')
          .select('id, customer_id, street, city, state, zip, geocoding_status')
          .or('gps_coordinates.is.null,geocoding_status.eq.failed,geocoding_status.is.null')
          .limit(10); // Process in batches to avoid rate limits

        if (error) {
          console.error('Error fetching locations for geocoding:', error);
          return;
        }

        if (!locationsNeedingGeocoding || locationsNeedingGeocoding.length === 0) {
          console.log('No locations need geocoding');
          return;
        }

        console.log(`Found ${locationsNeedingGeocoding.length} locations that need geocoding`);

        // Process each location
        for (const location of locationsNeedingGeocoding) {
          if (!location.street || !location.city || !location.state) {
            console.log(`Skipping location ${location.id} - missing address components`);
            continue;
          }

          console.log(`Geocoding location ${location.id}: ${location.street}, ${location.city}, ${location.state}`);

          const geocodeResult = await geocodeAddress(
            location.street,
            location.city,
            location.state,
            location.zip
          );

          // Update the location with geocoding results
          const updateData = {
            geocoding_status: geocodeResult.success ? 'success' : 'failed',
            geocoding_attempted_at: new Date().toISOString(),
            ...(geocodeResult.success && geocodeResult.coordinates ? {
              gps_coordinates: `POINT(${geocodeResult.coordinates[0]} ${geocodeResult.coordinates[1]})`
            } : {})
          };

          const { error: updateError } = await supabase
            .from('customer_service_locations')
            .update(updateData)
            .eq('id', location.id);

          if (updateError) {
            console.error(`Failed to update location ${location.id}:`, updateError);
          } else {
            console.log(`Successfully updated location ${location.id} with geocoding status: ${updateData.geocoding_status}`);
          }

          // Add a small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('Finished geocoding batch');
      } catch (error) {
        console.error('Error in auto-geocoding process:', error);
      }
    };

    // Run geocoding on component mount
    geocodeExistingLocations();
  }, []);
}