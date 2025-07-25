-- First, let's check what triggers currently exist and remove the redundant one
-- Drop the redundant trigger and function that's causing duplicates
DROP TRIGGER IF EXISTS sync_customer_default_location_trigger ON public.customers;
DROP FUNCTION IF EXISTS public.sync_customer_default_location();

-- Create a cleanup function to remove duplicate service locations
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_service_locations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_count INTEGER := 0;
  customer_record RECORD;
  location_to_keep_id UUID;
BEGIN
  -- For each customer that has multiple default service locations
  FOR customer_record IN 
    SELECT customer_id, COUNT(*) as location_count
    FROM public.customer_service_locations 
    WHERE is_default = true
    GROUP BY customer_id
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first one (by created_at) and delete the rest
    SELECT id INTO location_to_keep_id
    FROM public.customer_service_locations 
    WHERE customer_id = customer_record.customer_id 
      AND is_default = true
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Delete the duplicate default locations
    DELETE FROM public.customer_service_locations 
    WHERE customer_id = customer_record.customer_id 
      AND is_default = true 
      AND id != location_to_keep_id;
    
    -- Count how many we removed
    duplicate_count := duplicate_count + (customer_record.location_count - 1);
    
    RAISE LOG 'Cleaned up % duplicate locations for customer %', 
      (customer_record.location_count - 1), customer_record.customer_id;
  END LOOP;
  
  RETURN duplicate_count;
END;
$$;

-- Run the cleanup function
SELECT public.cleanup_duplicate_service_locations() as duplicates_removed;