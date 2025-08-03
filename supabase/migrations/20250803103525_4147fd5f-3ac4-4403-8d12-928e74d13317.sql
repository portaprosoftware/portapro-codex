-- Add missing foreign key constraint between customer_service_locations and customers
ALTER TABLE public.customer_service_locations 
ADD CONSTRAINT customer_service_locations_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;