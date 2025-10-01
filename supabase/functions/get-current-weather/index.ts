import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherResponse {
  weather: string;
  description: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  city?: string;
  state?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();
    
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!apiKey) {
      console.error('OPENWEATHER_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Weather API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`;
    const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
    
    // Fetch weather and location data in parallel
    const [weatherResponse, geoResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(geoUrl)
    ]);
    
    if (!weatherResponse.ok) {
      console.error('OpenWeatherMap API error:', weatherResponse.status, await weatherResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data' }),
        { status: weatherResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await weatherResponse.json();
    
    // Get location data (city, state)
    let city = '';
    let state = '';
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      if (geoData && geoData.length > 0) {
        city = geoData[0].name || '';
        state = geoData[0].state || '';
      }
    }
    
    // Map OpenWeatherMap condition codes to our dropdown values
    const weatherCode = data.weather[0].id;
    const temp = data.main.temp;
    const windSpeed = data.wind.speed;
    
    let mappedWeather = 'other';
    
    // Thunderstorm (200-232)
    if (weatherCode >= 200 && weatherCode < 300) {
      mappedWeather = 'storm';
    }
    // Drizzle or Rain (300-531)
    else if (weatherCode >= 300 && weatherCode < 600) {
      mappedWeather = 'rainy';
    }
    // Snow (600-622)
    else if (weatherCode >= 600 && weatherCode < 700) {
      mappedWeather = 'snowy';
    }
    // Atmosphere (mist, fog, haze) (701-781)
    else if (weatherCode >= 700 && weatherCode < 800) {
      mappedWeather = 'foggy';
    }
    // Clear (800)
    else if (weatherCode === 800) {
      mappedWeather = 'clear';
    }
    // Clouds (801-804)
    else if (weatherCode > 800 && weatherCode < 900) {
      mappedWeather = 'cloudy';
    }
    
    // Override based on temperature extremes
    if (temp > 85) {
      mappedWeather = 'hot';
    } else if (temp < 32) {
      mappedWeather = temp < 32 && (weatherCode >= 600 && weatherCode < 700) ? 'icy' : 'cold';
    }
    
    // Override based on wind speed (>20 mph)
    if (windSpeed > 20) {
      mappedWeather = 'windy';
    }

    const result: WeatherResponse = {
      weather: mappedWeather,
      description: data.weather[0].description,
      temp: Math.round(temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(windSpeed),
      city: city,
      state: state
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-current-weather function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
