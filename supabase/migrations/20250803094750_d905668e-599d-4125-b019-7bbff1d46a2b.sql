-- Remove selected_coordinate_ids from jobs table
ALTER TABLE public.jobs DROP COLUMN IF EXISTS selected_coordinate_ids;

-- Remove geocoding status fields from customer_service_locations
ALTER TABLE public.customer_service_locations 
DROP COLUMN IF EXISTS geocoding_status,
DROP COLUMN IF EXISTS geocoding_attempted_at;