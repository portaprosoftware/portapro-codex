import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let query = '';
    let limit = '5';

    if (req.method === 'GET') {
      // Handle GET request with URL parameters
      const url = new URL(req.url);
      query = url.searchParams.get('q') || '';
      limit = url.searchParams.get('limit') || '5';
    } else if (req.method === 'POST') {
      // Handle POST request with JSON body
      const body = await req.json();
      query = body.q || body.query || '';
      limit = body.limit || '5';
    }
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use Mapbox Geocoding API for address suggestions
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=${limit}&country=US&types=address,poi`;
    
    console.log('Fetching from Mapbox:', mapboxUrl);
    
    const response = await fetch(mapboxUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Mapbox API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch address suggestions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform Mapbox response to our format
    const suggestions = data.features.map((feature: any) => {
      // Extract address components from context
      const context = feature.context || [];
      let street = '', city = '', state = '', zip = '';
      
      // Parse address components
      const addressParts = feature.place_name.split(',').map((part: string) => part.trim());
      
      // First part is usually the street address
      street = addressParts[0] || '';
      
      // Find city, state, zip from context
      context.forEach((item: any) => {
        if (item.id.includes('place')) {
          city = item.text;
        } else if (item.id.includes('region')) {
          state = item.short_code?.replace('US-', '') || item.text;
        } else if (item.id.includes('postcode')) {
          zip = item.text;
        }
      });
      
      // If not found in context, try to parse from place_name
      if (!city && addressParts.length > 1) {
        city = addressParts[1];
      }
      if (!state && addressParts.length > 2) {
        const stateZip = addressParts[2].split(' ');
        state = stateZip[0];
        if (stateZip.length > 1) {
          zip = stateZip[1];
        }
      }

      return {
        id: feature.id,
        place_name: feature.place_name,
        center: feature.center, // [longitude, latitude]
        // Structured address components
        address_components: {
          street,
          city,
          state,
          zip
        },
        // Full address for display
        full_address: feature.place_name,
        coordinates: {
          longitude: feature.center[0],
          latitude: feature.center[1]
        }
      };
    });

    return new Response(
      JSON.stringify({ 
        suggestions,
        query,
        total: suggestions.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in mapbox-geocoding function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});