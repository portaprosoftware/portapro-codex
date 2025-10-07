import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Haversine formula to calculate distance between two GPS coordinates (in miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { zipCode } = await req.json()
    
    if (!zipCode) {
      return new Response(
        JSON.stringify({ error: 'Zip code is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    
    if (!googleApiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not configured in Supabase secrets')
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔍 Google: Geocoding ZIP code: ${zipCode}`)

    // Step 1: Geocode the ZIP code to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&components=country:US&key=${googleApiKey}`
    
    const geocodeResponse = await fetch(geocodeUrl)
    const geocodeData = await geocodeResponse.json()
    
    if (!geocodeResponse.ok || geocodeData.status !== 'OK') {
      console.error('❌ Google Geocoding failed:', geocodeData.status, geocodeData.error_message)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to geocode ZIP code', 
          gasStations: [],
          details: geocodeData.error_message 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!geocodeData.results || geocodeData.results.length === 0) {
      console.log(`⚠️ No geocoding results for ZIP: ${zipCode}`)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid ZIP code', 
          gasStations: [],
          message: 'No location found for this ZIP code'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const location = geocodeData.results[0].geometry.location
    const latitude = location.lat
    const longitude = location.lng
    
    console.log(`📍 Google: Geocoded to: ${latitude}, ${longitude}`)

    // Extract city and state from geocode results for consistent data
    let searchCity = ''
    let searchState = ''
    
    const addressComponents = geocodeData.results[0].address_components || []
    for (const component of addressComponents) {
      if (component.types.includes('locality')) {
        searchCity = component.long_name
      }
      if (component.types.includes('administrative_area_level_1')) {
        searchState = component.short_name
      }
    }
    
    console.log(`📍 Google: Search area - ${searchCity}, ${searchState} ${zipCode}`)

    // Step 2: Search for gas stations near these coordinates
    // Using 10km (10000m) radius for more localized results
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=10000&type=gas_station&key=${googleApiKey}`
    
    console.log('🏪 Google: Searching for gas stations...')
    
    const placesResponse = await fetch(placesUrl)
    const placesData = await placesResponse.json()
    
    if (!placesResponse.ok || placesData.status !== 'OK') {
      console.error('❌ Google Places search failed:', placesData.status, placesData.error_message)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to search for gas stations',
          gasStations: [],
          details: placesData.error_message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Google: Found ${placesData.results?.length || 0} gas stations`)

    // Step 3: Calculate distances and format results
    const gasStationsWithDistance = (placesData.results || []).map((place: any) => {
      // Calculate distance from search center
      const distance = calculateDistance(
        latitude,
        longitude,
        place.geometry?.location?.lat || 0,
        place.geometry?.location?.lng || 0
      );
      // Parse address components
      const vicinity = place.vicinity || ''
      const addressParts = vicinity.split(',').map((s: string) => s.trim())
      
      // Use the city and state from the ZIP code search for consistency
      // Only try to extract ZIP from vicinity if different from search ZIP
      let stationZip = zipCode
      let stationCity = searchCity
      let stationState = searchState
      
      // Try to extract ZIP from vicinity if present
      if (addressParts.length >= 2) {
        const lastPart = addressParts[addressParts.length - 1]
        const zipMatch = lastPart.match(/\d{5}/)
        if (zipMatch) {
          stationZip = zipMatch[0]
        }
      }

      return {
        id: place.place_id,
        name: place.name || 'Gas Station',
        address: addressParts[0] || vicinity,
        city: stationCity,
        state: stationState,
        zip: stationZip,
        phone: '', // Would need Place Details API for phone
        distance: distance, // Distance in miles
        coordinates: {
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0
        },
        metadata: {
          place_id: place.place_id,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          business_status: place.business_status,
          open_now: place.opening_hours?.open_now
        }
      }
    })

    // Step 4: Filter stations within 10km (~6.2 miles) and sort by distance
    const gasStations = gasStationsWithDistance
      .filter(station => station.distance <= 6.2)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)

    console.log(`📦 Returning ${gasStations.length} formatted gas stations`)

    return new Response(
      JSON.stringify({ 
        gasStations,
        searchCenter: { latitude, longitude },
        total: gasStations.length,
        source: 'google_places'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Error in search-gas-stations-google function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        gasStations: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
