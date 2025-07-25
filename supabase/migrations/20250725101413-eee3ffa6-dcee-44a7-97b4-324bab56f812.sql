-- Fix the sync_customer_service_location function 
-- Remove the invalid WHERE clause in ON CONFLICT
CREATE OR REPLACE FUNCTION public.sync_customer_service_location()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  location_name TEXT;
  service_street TEXT;
  service_street2 TEXT;
  service_city TEXT;
  service_state TEXT;
  service_zip TEXT;
BEGIN
  -- Determine which address to use based on the toggle
  IF NEW.default_service_differs_from_main = true THEN
    service_street := NEW.default_service_street;
    service_street2 := NEW.default_service_street2;
    service_city := NEW.default_service_city;
    service_state := NEW.default_service_state;
    service_zip := NEW.default_service_zip;
  ELSE
    service_street := NEW.service_street;
    service_street2 := NEW.service_street2;
    service_city := NEW.service_city;
    service_state := NEW.service_state;
    service_zip := NEW.service_zip;
  END IF;

  -- Only proceed if we have address data
  IF service_street IS NOT NULL AND service_street != '' THEN
    location_name := NEW.name || ' - Main Location';
    
    -- First, unset any existing default locations for this customer
    UPDATE public.customer_service_locations 
    SET is_default = false 
    WHERE customer_id = NEW.id AND is_default = true;
    
    -- Insert or update the default service location
    INSERT INTO public.customer_service_locations (
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
      NEW.id,
      location_name,
      'Auto-synced from customer service address',
      service_street,
      service_street2,
      service_city,
      service_state,
      service_zip,
      true,
      true,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$function$;