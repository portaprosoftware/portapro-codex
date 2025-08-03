-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to customer service locations" ON public.customer_service_locations;
DROP POLICY IF EXISTS "Allow public insert access to customer service locations" ON public.customer_service_locations;
DROP POLICY IF EXISTS "Allow public update access to customer service locations" ON public.customer_service_locations;

DROP POLICY IF EXISTS "Allow public read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public update access to customers" ON public.customers;

-- Disable RLS entirely on both tables
ALTER TABLE public.customer_service_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;