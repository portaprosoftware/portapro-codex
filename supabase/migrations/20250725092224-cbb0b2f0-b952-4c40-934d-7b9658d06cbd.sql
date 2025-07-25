-- Add fields to customers table for default service address management
ALTER TABLE public.customers 
ADD COLUMN default_service_street TEXT,
ADD COLUMN default_service_street2 TEXT,
ADD COLUMN default_service_city TEXT,
ADD COLUMN default_service_state TEXT,
ADD COLUMN default_service_zip TEXT,
ADD COLUMN default_service_differs_from_main BOOLEAN DEFAULT false;

-- Create function to sync customer service address with default service location
CREATE OR REPLACE FUNCTION public.sync_customer_service_location()
RETURNS TRIGGER AS $$
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
    )
    ON CONFLICT (customer_id, is_default) 
    WHERE is_default = true
    DO UPDATE SET
      location_name = EXCLUDED.location_name,
      location_description = EXCLUDED.location_description,
      street = EXCLUDED.street,
      street2 = EXCLUDED.street2,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      zip = EXCLUDED.zip,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync service locations when customer is updated
CREATE TRIGGER sync_customer_service_location_trigger
  AFTER INSERT OR UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_service_location();