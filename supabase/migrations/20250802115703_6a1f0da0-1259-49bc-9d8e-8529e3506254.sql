-- Create function to ensure exactly one default service location per customer
CREATE OR REPLACE FUNCTION public.ensure_single_default_service_location()
RETURNS TRIGGER AS $$
DECLARE
  location_count INTEGER;
  customer_uuid UUID;
BEGIN
  -- Get the customer_id from NEW or OLD record
  IF TG_OP = 'DELETE' THEN
    customer_uuid := OLD.customer_id;
  ELSE
    customer_uuid := NEW.customer_id;
  END IF;
  
  -- Count total locations for this customer
  SELECT COUNT(*) INTO location_count
  FROM public.customer_service_locations
  WHERE customer_id = customer_uuid;
  
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- If this is the first location, it must be default
    IF location_count = 1 THEN
      NEW.is_default := true;
    -- If setting as default, remove default from others
    ELSIF NEW.is_default = true THEN
      UPDATE public.customer_service_locations
      SET is_default = false
      WHERE customer_id = customer_uuid AND id != NEW.id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If this is the only location, it must remain default
    IF location_count = 1 THEN
      NEW.is_default := true;
    -- If setting as default, remove default from others
    ELSIF NEW.is_default = true AND OLD.is_default = false THEN
      UPDATE public.customer_service_locations
      SET is_default = false
      WHERE customer_id = customer_uuid AND id != NEW.id;
    -- Prevent removing default if this is the only default
    ELSIF OLD.is_default = true AND NEW.is_default = false THEN
      -- Check if there are other default locations
      DECLARE
        other_defaults INTEGER;
      BEGIN
        SELECT COUNT(*) INTO other_defaults
        FROM public.customer_service_locations
        WHERE customer_id = customer_uuid AND id != NEW.id AND is_default = true;
        
        -- If no other defaults, keep this one as default
        IF other_defaults = 0 THEN
          NEW.is_default := true;
        END IF;
      END;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- If deleting the default and there are other locations, make one of them default
    IF OLD.is_default = true AND location_count > 1 THEN
      UPDATE public.customer_service_locations
      SET is_default = true
      WHERE customer_id = customer_uuid 
        AND id != OLD.id 
        AND id = (
          SELECT id FROM public.customer_service_locations
          WHERE customer_id = customer_uuid AND id != OLD.id
          ORDER BY created_at ASC
          LIMIT 1
        );
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the function
DROP TRIGGER IF EXISTS ensure_default_service_location_insert ON public.customer_service_locations;
DROP TRIGGER IF EXISTS ensure_default_service_location_update ON public.customer_service_locations;
DROP TRIGGER IF EXISTS ensure_default_service_location_delete ON public.customer_service_locations;

CREATE TRIGGER ensure_default_service_location_insert
  BEFORE INSERT ON public.customer_service_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_service_location();

CREATE TRIGGER ensure_default_service_location_update
  BEFORE UPDATE ON public.customer_service_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_service_location();

CREATE TRIGGER ensure_default_service_location_delete
  BEFORE DELETE ON public.customer_service_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_service_location();

-- Fix any existing customers that have no default service location
UPDATE public.customer_service_locations
SET is_default = true
WHERE id IN (
  SELECT DISTINCT ON (customer_id) id
  FROM public.customer_service_locations csl1
  WHERE NOT EXISTS (
    SELECT 1 FROM public.customer_service_locations csl2
    WHERE csl2.customer_id = csl1.customer_id AND csl2.is_default = true
  )
  ORDER BY customer_id, created_at ASC
);