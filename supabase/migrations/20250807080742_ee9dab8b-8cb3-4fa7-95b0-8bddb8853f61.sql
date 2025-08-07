-- Add maintenance-specific fields to product_items table for enhanced tracking
ALTER TABLE public.product_items 
ADD COLUMN IF NOT EXISTS maintenance_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS maintenance_reason text,
ADD COLUMN IF NOT EXISTS expected_return_date date,
ADD COLUMN IF NOT EXISTS maintenance_notes text;

-- Add index for faster queries on maintenance items
CREATE INDEX IF NOT EXISTS idx_product_items_maintenance_status 
ON public.product_items(product_id, status) 
WHERE status = 'maintenance';

-- Add index for maintenance date queries
CREATE INDEX IF NOT EXISTS idx_product_items_maintenance_dates 
ON public.product_items(maintenance_start_date, expected_return_date) 
WHERE maintenance_start_date IS NOT NULL;

-- Update existing maintenance items to set maintenance_start_date if not set
UPDATE public.product_items 
SET maintenance_start_date = updated_at 
WHERE status = 'maintenance' 
AND maintenance_start_date IS NULL;

-- Add trigger to automatically set maintenance_start_date when status changes to maintenance
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
$function$;

-- Create trigger for automatic maintenance date handling
DROP TRIGGER IF EXISTS trigger_set_maintenance_start_date ON public.product_items;
CREATE TRIGGER trigger_set_maintenance_start_date
  BEFORE UPDATE ON public.product_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_maintenance_start_date();