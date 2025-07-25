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

    // This endpoint now serves weather forecast data for jobs/dashboard
    // Radar functionality moved to RainViewer (free API)
    
    // Get current weather and 5-day forecast
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=41.4993&lon=-81.6944&appid=${openWeatherApiKey}&units=imperial`
    )
    
    const forecastData = await weatherResponse.json()
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${forecastData.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        weatherKey: openWeatherApiKey,
        forecast: forecastData,
        currentTime: Math.floor(Date.now() / 1000)
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