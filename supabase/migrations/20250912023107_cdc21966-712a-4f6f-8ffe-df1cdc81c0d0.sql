-- Fix multiple default service locations issue

-- First, clean up existing data: for each customer, keep only the first created location as default
UPDATE public.customer_service_locations 
SET is_default = false 
WHERE id NOT IN (
  SELECT DISTINCT ON (customer_id) id 
  FROM public.customer_service_locations 
  WHERE is_default = true 
  ORDER BY customer_id, created_at ASC
) AND is_default = true;

-- Add unique constraint to prevent multiple defaults per customer
CREATE UNIQUE INDEX idx_customer_service_locations_unique_default 
ON public.customer_service_locations (customer_id) 
WHERE is_default = true;