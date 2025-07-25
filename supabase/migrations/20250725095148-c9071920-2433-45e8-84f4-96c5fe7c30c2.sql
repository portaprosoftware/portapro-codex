-- Disable RLS on customers table since using Clerk auth
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on other tables that don't need it with Clerk auth
ALTER TABLE public.customer_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_location_coordinates DISABLE ROW LEVEL SECURITY;