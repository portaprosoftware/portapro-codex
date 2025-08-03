-- Create a trigger function that automatically geocodes new service locations
CREATE OR REPLACE FUNCTION public.auto_geocode_service_location()
RETURNS TRIGGER AS $$
DECLARE
  full_address TEXT;
  geocode_result JSONB;
  coordinates_lat NUMERIC;
  coordinates_lng NUMERIC;
BEGIN
  -- Only geocode if we have the required address components and no GPS coordinates yet
  IF NEW.street IS NOT NULL 
     AND NEW.city IS NOT NULL 
     AND NEW.state IS NOT NULL 
     AND NEW.gps_coordinates IS NULL THEN
    
    -- Build full address
    full_address := TRIM(CONCAT_WS(' ', 
      NEW.street,
      NEW.street2,
      NEW.city,
      NEW.state,
      NEW.zip
    ));
    
    -- Log the geocoding attempt
    RAISE LOG 'Auto-geocoding service location % with address: %', NEW.id, full_address;
    
    -- Call the mapbox-geocoding edge function
    BEGIN
      SELECT content::jsonb INTO geocode_result
      FROM net.http_post(
        url := 'https://unpnuonbndubcuzxfnmg.supabase.co/functions/v1/mapbox-geocoding',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucG51b25ibmR1YmN1enhmbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkyMjgsImV4cCI6MjA2NDcxNTIyOH0.goME2hFzqxm0tnFdXAB_0evuiueh8wWfGLIY1vvvqmE"}'::jsonb,
        body := jsonb_build_object('q', full_address, 'limit', '1')::text
      );
      
      -- Extract coordinates from the response
      IF geocode_result IS NOT NULL 
         AND geocode_result ? 'suggestions' 
         AND jsonb_array_length(geocode_result->'suggestions') > 0 THEN
        
        coordinates_lat := (geocode_result->'suggestions'->0->'coordinates'->>'latitude')::NUMERIC;
        coordinates_lng := (geocode_result->'suggestions'->0->'coordinates'->>'longitude')::NUMERIC;
        
        -- Set the GPS coordinates and status
        NEW.gps_coordinates := POINT(coordinates_lng, coordinates_lat);
        NEW.geocoding_status := 'completed';
        NEW.geocoding_attempted_at := NOW();
        
        RAISE LOG 'Successfully geocoded service location % to coordinates: %, %', NEW.id, coordinates_lat, coordinates_lng;
      ELSE
        -- No results found
        NEW.geocoding_status := 'failed';
        NEW.geocoding_attempted_at := NOW();
        RAISE LOG 'No geocoding results found for service location % with address: %', NEW.id, full_address;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Geocoding failed
      NEW.geocoding_status := 'failed';
      NEW.geocoding_attempted_at := NOW();
      RAISE LOG 'Geocoding failed for service location % with error: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to automatically geocode service locations on insert
DROP TRIGGER IF EXISTS trigger_auto_geocode_service_location ON public.customer_service_locations;
CREATE TRIGGER trigger_auto_geocode_service_location
  BEFORE INSERT ON public.customer_service_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_geocode_service_location();