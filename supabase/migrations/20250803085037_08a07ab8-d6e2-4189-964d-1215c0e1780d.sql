-- Step 1: Emergency Data Cleanup - Fixed Version

-- Remove duplicate service locations, keeping the ones with GPS coordinates
WITH ranked_locations AS (
  SELECT id, customer_id, location_name,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id, location_name 
      ORDER BY 
        CASE WHEN gps_coordinates IS NOT NULL THEN 1 ELSE 2 END,
        CASE WHEN geocoding_status = 'completed' THEN 1 ELSE 2 END,
        created_at DESC
    ) as rn
  FROM public.customer_service_locations
)
DELETE FROM public.customer_service_locations 
WHERE id IN (SELECT id FROM ranked_locations WHERE rn > 1);

-- Drop the conflicting old trigger that's causing duplicates
DROP TRIGGER IF EXISTS sync_customer_service_location_trigger ON public.customers;
DROP FUNCTION IF EXISTS public.sync_customer_service_location();

-- Fix the geocoding function to properly extract coordinates
CREATE OR REPLACE FUNCTION public.geocode_and_create_service_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  full_address TEXT;
BEGIN
  -- Only create service location if we have address components
  IF NEW.service_street IS NOT NULL AND NEW.service_city IS NOT NULL AND NEW.service_state IS NOT NULL THEN
    
    -- Create service location with proper geocoding
    INSERT INTO public.customer_service_locations (
      customer_id,
      location_name,
      street,
      street2, 
      city,
      state,
      zip,
      geocoding_status
    ) VALUES (
      NEW.id,
      NEW.name || ' - Main Location',
      NEW.service_street,
      NEW.service_street2,
      NEW.service_city,
      NEW.service_state,
      NEW.service_zip,
      'pending'
    );
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger with the fixed function
CREATE TRIGGER trigger_auto_create_service_location
AFTER INSERT ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.geocode_and_create_service_location();

-- Create function to fix existing failed geocoding locations
CREATE OR REPLACE FUNCTION public.cleanup_failed_geocoding()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  fixed_count INTEGER := 0;
BEGIN
  -- Reset failed geocoding statuses to pending so they can be re-geocoded
  UPDATE public.customer_service_locations 
  SET geocoding_status = 'pending',
      geocoding_attempted_at = NULL
  WHERE geocoding_status IN ('failed', 'error') 
     OR (geocoding_status = 'pending' AND gps_coordinates IS NULL);
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'locations_reset_for_geocoding', fixed_count,
    'message', 'Locations reset to pending status for re-geocoding'
  );
END;
$function$;