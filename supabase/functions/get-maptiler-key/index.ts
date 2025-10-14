import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Fetching MapTiler API key...');
    
    const rawKey = Deno.env.get('MAPTILER_API_KEY') || '';
    const mapTilerKey = rawKey.trim(); // Sanitize key to remove whitespace
    
    if (!mapTilerKey) {
      console.error('MapTiler API key not configured in secrets');
      return new Response(
        JSON.stringify({ error: 'MapTiler API key not configured' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('MapTiler API key retrieved successfully');
    
    return new Response(
      JSON.stringify({ apiKey: mapTilerKey }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in get-maptiler-key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
