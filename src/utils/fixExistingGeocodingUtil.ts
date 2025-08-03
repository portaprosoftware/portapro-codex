import { supabase } from '@/integrations/supabase/client';
import { geocodeAddress } from './geocoding';

export async function fixDisasterServicesGeocoding() {
  try {
    console.log('Fixing Disaster Services USA geocoding...');
    
    // Get the correct coordinates using Mapbox API
    const geocodeResult = await geocodeAddress(
      '1319 Hathaway Avenue',
      'Lakewood',
      'OH',
      '44107'
    );
    
    if (!geocodeResult.success || !geocodeResult.coordinates) {
      throw new Error(`Failed to geocode address: ${geocodeResult.error}`);
    }
    
    console.log('Correct coordinates for Disaster Services USA:', geocodeResult.coordinates);
    
    // Update the service location with correct coordinates
    const { data, error } = await supabase
      .from('customer_service_locations')
      .update({
        gps_coordinates: `POINT(${geocodeResult.coordinates[0]} ${geocodeResult.coordinates[1]})`,
        geocoding_status: 'success',
        geocoding_attempted_at: new Date().toISOString()
      })
      .eq('customer_id', 'd8fe0a5b-e3f8-4b81-b99a-0cca5d93a56c')
      .eq('street', '1319 Hathaway Avenue')
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('Successfully updated Disaster Services USA coordinates:', data);
    return { success: true, coordinates: geocodeResult.coordinates };
    
  } catch (error) {
    console.error('Failed to fix Disaster Services geocoding:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}