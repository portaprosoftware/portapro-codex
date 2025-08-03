import { supabase } from '@/integrations/supabase/client';

export interface GeocodeResult {
  success: boolean;
  coordinates?: [number, number]; // [longitude, latitude]
  error?: string;
}

export async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zip?: string
): Promise<GeocodeResult> {
  try {
    const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
    
    console.log('Geocoding address:', fullAddress);
    
    const { data, error } = await supabase.functions.invoke('mapbox-geocoding', {
      body: { q: fullAddress, limit: 1 }
    });

    if (error) {
      console.error('Geocoding API error:', error);
      return { success: false, error: error.message };
    }

    if (data?.suggestions && data.suggestions.length > 0) {
      const suggestion = data.suggestions[0];
      const coordinates: [number, number] = [
        suggestion.coordinates.longitude,
        suggestion.coordinates.latitude
      ];
      
      console.log('Geocoding successful:', coordinates);
      return { success: true, coordinates };
    } else {
      console.warn('No geocoding results found for:', fullAddress);
      return { success: false, error: 'No coordinates found for this address' };
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown geocoding error' 
    };
  }
}

export async function createServiceLocationWithGeocoding(
  customerId: string,
  locationName: string,
  street: string,
  city: string,
  state: string,
  zip?: string,
  street2?: string
) {
  console.log('Creating service location with geocoding for customer:', customerId);
  
  // First geocode the address
  const geocodeResult = await geocodeAddress(street, city, state, zip);
  
  const locationData = {
    customer_id: customerId,
    location_name: locationName,
    street,
    street2: street2 || null,
    city,
    state,
    zip: zip || null,
    is_default: true,
    is_active: true,
    geocoding_status: geocodeResult.success ? 'success' : 'failed',
    geocoding_attempted_at: new Date().toISOString(),
    gps_coordinates: geocodeResult.success && geocodeResult.coordinates 
      ? `POINT(${geocodeResult.coordinates[0]} ${geocodeResult.coordinates[1]})`
      : null
  };

  console.log('Inserting service location:', locationData);

  const { data, error } = await supabase
    .from('customer_service_locations')
    .insert(locationData)
    .select();

  if (error) {
    console.error('Service location creation error:', error);
    throw error;
  }

  console.log('Service location created successfully:', data);
  return data[0];
}