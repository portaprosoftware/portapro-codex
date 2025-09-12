-- Drop the trigger that auto-creates service locations for customers
-- This prevents duplicate service locations since the frontend already handles this manually
DROP TRIGGER IF EXISTS trigger_auto_create_service_location ON public.customers;

-- Also drop the function if it exists
DROP FUNCTION IF EXISTS public.auto_create_service_location();