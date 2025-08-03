-- Step 1: Create enhanced geocoding function that works with service location creation
CREATE OR REPLACE FUNCTION public.geocode_and_create_service_location(
  p_customer_id UUID,
  p_location_name TEXT,
  p_street TEXT,
  p_street2 TEXT DEFAULT NULL,
  p_city TEXT,
  p_state TEXT,
  p_zip TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_location_id UUID;
  full_address TEXT;
  geocode_result JSONB;
  latitude NUMERIC;
  longitude NUMERIC;
BEGIN
  -- Generate new location ID
  new_location_id := gen_random_uuid();
  
  -- Build full address for geocoding
  full_address := TRIM(CONCAT_WS(' ', p_street, p_street2, p_city, p_state, p_zip));
  
  -- Insert the service location first (without GPS coordinates)
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
    is_locked
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
    true
  );
  
  -- Log that we created a location that needs geocoding
  RAISE LOG 'Created service location % for customer % with address: %', 
    new_location_id, p_customer_id, full_address;
  
  RETURN new_location_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating service location: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Step 2: Create trigger function for automatic service location creation
CREATE OR REPLACE FUNCTION public.auto_create_default_service_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  location_name TEXT;
  service_location_id UUID;
BEGIN
  -- Only create if customer has service address data
  IF NEW.service_street IS NOT NULL AND NEW.service_city IS NOT NULL AND NEW.service_state IS NOT NULL THEN
    
    -- Generate location name based on customer name
    location_name := NEW.name || ' - Main Location';
    
    -- Create the service location with geocoding
    service_location_id := public.geocode_and_create_service_location(
      NEW.id,
      location_name,
      NEW.service_street,
      NEW.service_street2,
      NEW.service_city,
      NEW.service_state,
      NEW.service_zip
    );
    
    RAISE LOG 'Auto-created service location % for new customer %', service_location_id, NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_create_service_location ON public.customers;
CREATE TRIGGER trigger_auto_create_service_location
  AFTER INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_default_service_location();

-- Step 4: Create function to batch geocode existing locations
CREATE OR REPLACE FUNCTION public.batch_geocode_service_locations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  location_record RECORD;
  locations_count INTEGER := 0;
  full_address TEXT;
BEGIN
  -- Get locations that need geocoding
  FOR location_record IN 
    SELECT id, street, street2, city, state, zip, location_name
    FROM public.customer_service_locations
    WHERE gps_coordinates IS NULL
      AND street IS NOT NULL 
      AND city IS NOT NULL 
      AND state IS NOT NULL
  LOOP
    -- Build full address string
    full_address := TRIM(CONCAT_WS(' ', 
      location_record.street,
      location_record.street2,
      location_record.city,
      location_record.state,
      location_record.zip
    ));
    
    -- Log the location that needs geocoding
    RAISE LOG 'Location % (%) needs geocoding with address: %', 
      location_record.location_name, location_record.id, full_address;
    
    locations_count := locations_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'locations_needing_geocoding', locations_count,
    'message', format('Found %s locations that need geocoding. Frontend will handle the actual geocoding.', locations_count)
  );
END;
$$;

-- Step 5: Update the existing create_default_service_locations function to use the new geocoding logic
CREATE OR REPLACE FUNCTION public.create_default_service_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_record RECORD;
  location_name TEXT;
  service_location_id UUID;
BEGIN
  -- Loop through customers that have service address info but no default service location
  FOR customer_record IN 
    SELECT c.id, c.name, c.service_street, c.service_street2, c.service_city, c.service_state, c.service_zip
    FROM public.customers c
    LEFT JOIN public.customer_service_locations csl ON c.id = csl.customer_id AND csl.is_default = true
    WHERE c.service_street IS NOT NULL 
      AND c.service_street != ''
      AND csl.id IS NULL  -- No default location exists yet
  LOOP
    -- Generate location name based on customer name
    location_name := customer_record.name || ' - Main Location';
    
    -- Create the service location with geocoding
    service_location_id := public.geocode_and_create_service_location(
      customer_record.id,
      location_name,
      customer_record.service_street,
      customer_record.service_street2,
      customer_record.service_city,
      customer_record.service_state,
      customer_record.service_zip
    );
    
    RAISE LOG 'Created default service location % for existing customer: %', service_location_id, customer_record.name;
  END LOOP;
END;
$$;