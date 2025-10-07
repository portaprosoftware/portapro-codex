import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Step 2: Search for gas stations near these coordinates
    // Using 50km (50000m) radius for comprehensive results
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=50000&type=gas_station&key=${googleApiKey}`
    
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

    // Step 3: Format results for our UI
    const gasStations = (placesData.results || []).slice(0, 20).map((place: any) => {
      // Parse address components
      const vicinity = place.vicinity || ''
      const addressParts = vicinity.split(',').map((s: string) => s.trim())
      
      // Try to extract city, state, zip from vicinity
      let city = ''
      let state = ''
      let stationZip = zipCode // Default to search ZIP
      
      if (addressParts.length >= 2) {
        // Last part usually contains "City, State ZIP"
        const lastPart = addressParts[addressParts.length - 1]
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5})/)
        if (stateZipMatch) {
          state = stateZipMatch[1]
          stationZip = stateZipMatch[2]
          city = addressParts[addressParts.length - 1].replace(stateZipMatch[0], '').trim()
        } else {
          // Try just state
          const stateMatch = lastPart.match(/([A-Z]{2})/)
          if (stateMatch) {
            state = stateMatch[1]
            city = lastPart.replace(stateMatch[0], '').trim()
          }
        }
      }

      return {
        id: place.place_id,
        name: place.name || 'Gas Station',
        address: addressParts[0] || vicinity,
        city: city || '',
        state: state || '',
        zip: stationZip,
        phone: '', // Would need Place Details API for phone
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
