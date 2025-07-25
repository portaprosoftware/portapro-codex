-- Disable triggers that might interfere with deletion
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON public.jobs;
DROP FUNCTION IF EXISTS public.update_customer_stats();

-- Remove any other problematic triggers
DROP TRIGGER IF EXISTS log_consumable_stock_change_trigger ON public.consumables;

-- Step 5: Clean up timezone-related database functions 
DROP TRIGGER IF EXISTS validate_zip_trigger ON public.customer_service_locations;
DROP TRIGGER IF EXISTS validate_customer_zip_trigger ON public.customers;
DROP TRIGGER IF EXISTS update_timezone_cache_trigger ON public.customer_service_locations;

DROP FUNCTION IF EXISTS public.validate_zip_code(text);
DROP FUNCTION IF EXISTS public.validate_service_location_zip();
DROP FUNCTION IF EXISTS public.validate_customer_zip();
DROP FUNCTION IF EXISTS public.update_location_timezone_cache();

-- Remove timezone cache columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_service_locations' 
    AND column_name = 'cached_timezone'
  ) THEN
    ALTER TABLE public.customer_service_locations 
    DROP COLUMN cached_timezone;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_service_locations' 
    AND column_name = 'timezone_updated_at'
  ) THEN
    ALTER TABLE public.customer_service_locations 
    DROP COLUMN timezone_updated_at;
  END IF;
END $$;

-- Now delete all customer data safely
TRUNCATE TABLE public.jobs CASCADE;
TRUNCATE TABLE public.customer_communications CASCADE;
TRUNCATE TABLE public.service_location_coordinates CASCADE;
TRUNCATE TABLE public.customer_service_locations CASCADE;
TRUNCATE TABLE public.customer_contacts CASCADE;
TRUNCATE TABLE public.quote_items CASCADE;
TRUNCATE TABLE public.quotes CASCADE;
TRUNCATE TABLE public.invoice_items CASCADE;
TRUNCATE TABLE public.invoice_overdue_dismissals CASCADE;
TRUNCATE TABLE public.invoices CASCADE;
TRUNCATE TABLE public.customer_stats CASCADE;
TRUNCATE TABLE public.customers CASCADE;

-- Reset sequence counters
UPDATE public.company_settings 
SET 
  next_quote_number = 1,
  next_invoice_number = 1,
  next_delivery_number = 1,
  next_pickup_number = 1,
  next_service_number = 1;