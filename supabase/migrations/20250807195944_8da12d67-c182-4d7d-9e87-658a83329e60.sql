CREATE OR REPLACE FUNCTION public.set_maintenance_start_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If status is changing to maintenance and no start date is set
  IF NEW.status = 'maintenance' AND (OLD.status IS NULL OR OLD.status != 'maintenance') THEN
    -- Set maintenance start date to now if not already set
    IF NEW.maintenance_start_date IS NULL THEN
      NEW.maintenance_start_date = now();
    END IF;
    -- Always set condition to needs repair when entering maintenance
    NEW.condition = 'needs repair';
  END IF;
  
  -- If status is changing from maintenance to something else, clear maintenance fields
  IF OLD.status = 'maintenance' AND NEW.status != 'maintenance' THEN
    NEW.maintenance_start_date = NULL;
    NEW.maintenance_reason = NULL;
    NEW.expected_return_date = NULL;
    NEW.maintenance_notes = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$