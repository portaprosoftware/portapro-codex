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
    
    // Search for gas stations using Mapbox Search API
    // Using the category 'fuel' to find gas stations
    const searchUrl = `https://api.mapbox.com/search/searchbox/v1/category/fuel?proximity=${longitude},${latitude}&limit=20&access_token=${mapboxToken}`
    
    const searchResponse = await fetch(searchUrl)
    
    if (!searchResponse.ok) {
      console.error('Mapbox search failed:', await searchResponse.text())
      throw new Error('Failed to search for gas stations')
    }

    const searchData = await searchResponse.json()
    
    // Format the results
    const gasStations = (searchData.features || []).map((feature: any) => {
      const props = feature.properties || {}
      const coords = feature.geometry?.coordinates || [0, 0]
      
      // Extract address components
      const fullAddress = props.full_address || props.address || ''
      const addressParts = fullAddress.split(',').map((s: string) => s.trim())
      
      return {
        id: feature.id || `station-${Math.random()}`,
        name: props.name || 'Gas Station',
        address: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2]?.split(' ')[0] || '',
        zip: addressParts[2]?.split(' ')[1] || zipCode,
        phone: props.phone || '',
        coordinates: {
          longitude: coords[0],
          latitude: coords[1]
        },
        metadata: props.metadata || {}
      }
    })

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
