-- Add missing geocoding_attempted_at column to customer_service_locations table
ALTER TABLE public.customer_service_locations 
ADD COLUMN geocoding_attempted_at timestamp with time zone;