-- Add missing geocoding_status column to customer_service_locations table
ALTER TABLE public.customer_service_locations 
ADD COLUMN geocoding_status text DEFAULT 'pending';