-- Step 5: Clean up timezone-related database functions and simpler customer deletion

-- Remove any timezone validation triggers that were added
DROP TRIGGER IF EXISTS validate_zip_trigger ON public.customer_service_locations;
DROP TRIGGER IF EXISTS validate_customer_zip_trigger ON public.customers;
DROP TRIGGER IF EXISTS update_timezone_cache_trigger ON public.customer_service_locations;

-- Remove timezone validation functions
DROP FUNCTION IF EXISTS public.validate_zip_code(text);
DROP FUNCTION IF EXISTS public.validate_service_location_zip();
DROP FUNCTION IF EXISTS public.validate_customer_zip();
DROP FUNCTION IF EXISTS public.update_location_timezone_cache();

-- Remove timezone cache columns if they exist
DO $$
BEGIN
  -- Remove timezone cache columns from customer_service_locations
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_service_locations' 
    AND column_name = 'cached_timezone'
  ) THEN
    ALTER TABLE public.customer_service_locations 
    DROP COLUMN IF EXISTS cached_timezone;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_service_locations' 
    AND column_name = 'timezone_updated_at'
  ) THEN
    ALTER TABLE public.customer_service_locations 
    DROP COLUMN IF EXISTS timezone_updated_at;
  END IF;
END $$;

-- Delete ALL customers and their related data (only what exists)
-- Delete in proper order to avoid foreign key constraints

-- Delete jobs first (this should cascade to related job data)
DELETE FROM public.jobs;

-- Delete customer-related data
DELETE FROM public.customer_communications;
DELETE FROM public.service_location_coordinates WHERE service_location_id IN (SELECT id FROM public.customer_service_locations);
DELETE FROM public.customer_service_locations;
DELETE FROM public.customer_contacts;

-- Delete quotes and invoices
DELETE FROM public.quote_items WHERE quote_id IN (SELECT id FROM public.quotes);
DELETE FROM public.quotes;
DELETE FROM public.invoice_items WHERE invoice_id IN (SELECT id FROM public.invoices);
DELETE FROM public.invoice_overdue_dismissals;
DELETE FROM public.invoices;

-- Finally delete all customers
DELETE FROM public.customers;

-- Reset sequence counters
UPDATE public.company_settings 
SET 
  next_quote_number = 1,
  next_invoice_number = 1,
  next_delivery_number = 1,
  next_pickup_number = 1,
  next_service_number = 1
WHERE id IS NOT NULL;