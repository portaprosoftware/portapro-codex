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

    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First, geocode the zip code to get coordinates
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(zipCode)}.json?country=US&types=postcode&access_token=${mapboxToken}`
    
    const geocodeResponse = await fetch(geocodeUrl)
    
    if (!geocodeResponse.ok) {
      throw new Error('Failed to geocode zip code')
    }

    const geocodeData = await geocodeResponse.json()
    
    if (!geocodeData.features || geocodeData.features.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid zip code', gasStations: [] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const [longitude, latitude] = geocodeData.features[0].center
    
    console.log(`🔍 Searching for gas stations near: ${latitude}, ${longitude}`)
    
    // Search for gas stations using Mapbox Geocoding API
    const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/gas%20station.json?proximity=${longitude},${latitude}&limit=20&access_token=${mapboxToken}`
    
    console.log('📡 Mapbox search URL:', searchUrl.replace(mapboxToken, 'TOKEN'))
    
    const searchResponse = await fetch(searchUrl)
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('❌ Mapbox search failed:', errorText)
      throw new Error('Failed to search for gas stations')
    }

    const searchData = await searchResponse.json()
    console.log(`✅ Mapbox returned ${searchData.features?.length || 0} features`)
    
    // Format the results
    const gasStations = (searchData.features || []).map((feature: any) => {
      const coords = feature.geometry?.coordinates || [0, 0]
      const placeName = feature.place_name || ''
      
      // Extract address components from context
      const context = feature.context || []
      let city = ''
      let state = ''
      let zip = zipCode
      
      context.forEach((ctx: any) => {
        if (ctx.id.startsWith('place')) city = ctx.text
        if (ctx.id.startsWith('region')) state = ctx.short_code?.replace('US-', '') || ctx.text
        if (ctx.id.startsWith('postcode')) zip = ctx.text
      })
      
      // Extract street address (before the first comma)
      const address = placeName.split(',')[0] || ''
      
      return {
        id: feature.id || `station-${Math.random()}`,
        name: feature.text || 'Gas Station',
        address: address,
        city: city,
        state: state,
        zip: zip,
        phone: feature.properties?.tel || feature.properties?.phone || '',
        coordinates: {
          longitude: coords[0],
          latitude: coords[1]
        },
        metadata: feature.properties || {}
      }
    })
    
    console.log(`📍 Formatted ${gasStations.length} gas stations`)

    return new Response(
      JSON.stringify({ 
        gasStations,
        searchCenter: { latitude, longitude },
        total: gasStations.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in search-gas-stations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
