-- Enable RLS on customer_service_locations table if not already enabled
ALTER TABLE public.customer_service_locations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow reading and writing customer service locations
CREATE POLICY IF NOT EXISTS "Allow public read access to customer service locations" 
ON public.customer_service_locations 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert access to customer service locations" 
ON public.customer_service_locations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update access to customer service locations" 
ON public.customer_service_locations 
FOR UPDATE 
USING (true);

-- Also fix the customers table if needed
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read access to customers" 
ON public.customers 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert access to customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update access to customers" 
ON public.customers 
FOR UPDATE 
USING (true);