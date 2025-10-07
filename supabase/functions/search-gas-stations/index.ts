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

    // Build a local bounding box (~50km radius) to constrain results
    const radiusKm = 50
    const latDelta = radiusKm / 111.32
    const lonDelta = radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))
    const minLon = longitude - lonDelta
    const maxLon = longitude + lonDelta
    const minLat = latitude - latDelta
    const maxLat = latitude + latDelta
    
    console.log(`🔍 Searching for US gas stations near: ${latitude}, ${longitude}`)
    console.log('🧭 Using bbox:', { minLon, minLat, maxLon, maxLat })
    
    // Use Mapbox Geocoding API for POIs, constrained to US and bbox
    const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/gas%20station.json?proximity=${longitude},${latitude}&types=poi&country=US&language=en&bbox=${minLon},${minLat},${maxLon},${maxLat}&limit=20&access_token=${mapboxToken}`
    
    console.log('📡 Mapbox search URL:', searchUrl.replace(mapboxToken, 'TOKEN'))
    
    const searchResponse = await fetch(searchUrl)
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('❌ Mapbox search failed:', errorText)
      throw new Error('Failed to search for gas stations')
    }

    const searchData = await searchResponse.json()
    console.log(`✅ Mapbox returned ${searchData.features?.length || 0} features`)
    
    // Helper to compute distance (km)
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (v: number) => (v * Math.PI) / 180
      const R = 6371
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // Format the results (POIs only) and sort by distance
    let gasStations = (searchData.features || []).map((feature: any) => {
      const coords = feature.geometry?.coordinates || [0, 0]
      const placeName = feature.place_name || ''
      const context = feature.context || []

      let city = ''
      let state = ''
      let zip = zipCode
      context.forEach((ctx: any) => {
        if (ctx.id.startsWith('place')) city = ctx.text
        if (ctx.id.startsWith('region')) state = ctx.short_code?.replace('US-', '') || ctx.text
        if (ctx.id.startsWith('postcode')) zip = ctx.text
      })

      const parts = placeName.split(',').map((s: string) => s.trim())
      const address = (feature.properties?.address || parts[1] || '').trim()

      return {
        id: feature.id || `station-${Math.random()}`,
        name: feature.text || feature.properties?.name || 'Gas Station',
        address,
        city,
        state,
        zip,
        phone: feature.properties?.tel || feature.properties?.phone || '',
        coordinates: {
          longitude: coords[0],
          latitude: coords[1]
        },
        distance_km: haversine(latitude, longitude, coords[1], coords[0]),
        metadata: feature.properties || {}
      }
    })

    // Keep only results within ~75km and sort by nearest
    gasStations = gasStations
      .filter((g: any) => (g.distance_km ?? 9999) <= 75)
      .sort((a: any, b: any) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
      .map(({ distance_km, ...rest }: any) => rest)
    
    console.log(`📍 Formatted ${gasStations.length} gas stations (post-filter)`)

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
