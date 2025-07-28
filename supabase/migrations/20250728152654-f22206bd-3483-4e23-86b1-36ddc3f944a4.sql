-- Remove all RLS policies from all tables
-- This will fix the "UPDATE requires a WHERE clause" error

-- Drop all policies from customers table
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.customers;

-- Disable RLS on all tables (based on the custom instructions: NO RLS POLICIES EVER)
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop any remaining policies on other tables that might be causing issues
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;