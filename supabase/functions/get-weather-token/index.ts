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
    const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY')
    
    if (!openWeatherApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenWeather API key not configured' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return current precipitation layer data
    const now = new Date()
    
    return new Response(
      JSON.stringify({ 
        success: true,
        weatherKey: openWeatherApiKey,
        currentLayer: {
          id: 'current-weather-radar',
          sourceId: 'current-weather-radar-source',
          url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`,
          type: 'precipitation',
          timestamp: Math.floor(now.getTime() / 1000)
        },
        currentTime: Math.floor(now.getTime() / 1000)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error retrieving weather data:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to retrieve weather data' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})