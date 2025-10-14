-- Fix the ensure_single_default_service_location trigger to prevent conflicts
-- The issue: the trigger was forcing is_default = true when location_count = 1,
-- but this caused conflicts when customers already had a default location

CREATE OR REPLACE FUNCTION public.ensure_single_default_service_location()
RETURNS TRIGGER AS $$
DECLARE
  location_count INTEGER;
BEGIN
  -- Count existing locations for this customer (excluding the one being inserted)
  SELECT COUNT(*)
  INTO location_count
  FROM public.customer_service_locations
  WHERE customer_id = NEW.customer_id;

  -- Only force is_default = true if this is the FIRST location (count = 0)
  -- This prevents conflicts when adding additional locations
  IF location_count = 0 THEN
    NEW.is_default := true;
  ELSIF NEW.is_default = true THEN
    -- If user explicitly sets a new location as default, unset other defaults
    UPDATE public.customer_service_locations
    SET is_default = false
    WHERE customer_id = NEW.customer_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;