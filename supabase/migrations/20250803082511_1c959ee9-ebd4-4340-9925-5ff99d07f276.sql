-- Step 6: Complete database schema optimizations

-- Add index on gps_coordinates for better map query performance
CREATE INDEX IF NOT EXISTS idx_customer_service_locations_gps_coordinates 
ON public.customer_service_locations USING gist (gps_coordinates);

-- Add geocoding status tracking to prevent infinite retry loops
ALTER TABLE public.customer_service_locations 
ADD COLUMN IF NOT EXISTS geocoding_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS geocoding_status TEXT DEFAULT 'pending' CHECK (geocoding_status IN ('pending', 'success', 'failed', 'skipped'));

-- Add helpful comment to track geocoding status
COMMENT ON COLUMN public.customer_service_locations.geocoding_status IS 'Tracks the status of geocoding attempts: pending (not attempted), success (coordinates found), failed (geocoding failed), skipped (no address to geocode)';
COMMENT ON COLUMN public.customer_service_locations.geocoding_attempted_at IS 'Timestamp of the last geocoding attempt';

-- Update the geocoding function to track status
CREATE OR REPLACE FUNCTION public.geocode_and_create_service_location(
  p_customer_id UUID,
  p_location_name TEXT,
  p_street TEXT,
  p_city TEXT,
  p_state TEXT,
  p_zip TEXT,
  p_street2 TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_location_id UUID;
  full_address TEXT;
  geocoding_status_val TEXT := 'pending';
BEGIN
  -- Generate new location ID
  new_location_id := gen_random_uuid();
  
  -- Build full address for geocoding
  full_address := TRIM(CONCAT_WS(' ', p_street, p_street2, p_city, p_state, p_zip));
  
  -- Determine initial geocoding status
  IF p_street IS NULL OR p_city IS NULL OR p_state IS NULL THEN
    geocoding_status_val := 'skipped';
  END IF;
  
  -- Insert the service location with geocoding tracking
  INSERT INTO public.customer_service_locations (
    id,
    customer_id,
    location_name,
    location_description,
    street,
    street2,
    city,
    state,
    zip,
    is_active,
    is_default,
    is_locked,
    geocoding_status,
    geocoding_attempted_at
  ) VALUES (
    new_location_id,
    p_customer_id,
    p_location_name,
    'Auto-generated from customer service address',
    p_street,
    p_street2,
    p_city,
    p_state,
    p_zip,
    true,
    true,
    true,
    geocoding_status_val,
    CASE WHEN geocoding_status_val = 'pending' THEN now() ELSE NULL END
  );
  
  -- Log that we created a location that needs geocoding
  RAISE LOG 'Created service location % for customer % with address: % (status: %)', 
    new_location_id, p_customer_id, full_address, geocoding_status_val;
  
  RETURN new_location_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating service location: %', SQLERRM;
  RETURN NULL;
END;
$$;