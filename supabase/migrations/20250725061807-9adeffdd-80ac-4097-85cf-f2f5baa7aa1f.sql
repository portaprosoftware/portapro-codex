-- Step 5: Clean up timezone-related database functions and triggers that might be causing performance issues

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
    
    ALTER TABLE public.customer_service_locations 
    DROP COLUMN IF EXISTS timezone_updated_at;
  END IF;
END $$;

-- Clean up any other timezone-related performance bottlenecks
-- Remove any indexes that might be slowing things down
DROP INDEX IF EXISTS idx_customer_service_locations_zip;
DROP INDEX IF EXISTS idx_customers_service_zip;

-- Delete ALL customers and their related data
-- This will cascade and clean everything up properly

-- First delete all related data to avoid foreign key constraints
DELETE FROM public.job_consumables WHERE job_id IN (SELECT id FROM public.jobs);
DELETE FROM public.job_notes WHERE job_id IN (SELECT id FROM public.jobs);
DELETE FROM public.job_equipment_assignments WHERE job_id IN (SELECT id FROM public.jobs);
DELETE FROM public.equipment_assignments WHERE job_id IN (SELECT id FROM public.jobs);
DELETE FROM public.vehicle_assignments WHERE job_id IN (SELECT id FROM public.jobs);
DELETE FROM public.job_items WHERE job_id IN (SELECT id FROM public.jobs);
DELETE FROM public.location_time_logs WHERE job_id IN (SELECT id FROM public.jobs);

-- Delete jobs
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

-- Reset any sequence counters that might be related to customers
-- This ensures clean imports
UPDATE public.company_settings 
SET 
  next_quote_number = 1,
  next_invoice_number = 1,
  next_delivery_number = 1,
  next_pickup_number = 1,
  next_service_number = 1
WHERE id IS NOT NULL;