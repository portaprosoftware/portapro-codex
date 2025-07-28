-- Fix the UPDATE requires WHERE clause issue
-- This is likely caused by a trigger that has an improper UPDATE statement

-- Drop and recreate problematic functions that might be causing the issue
-- Let's start with the automation requests function which might be interfering

DROP FUNCTION IF EXISTS public.update_automation_requests_updated_at() CASCADE;

-- Recreate it properly
CREATE OR REPLACE FUNCTION public.update_automation_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if there are any triggers on customers table that might be problematic
-- and ensure they're properly set up

-- Remove any problematic triggers on customers table
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;

-- Recreate the customers updated_at trigger properly
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Also check for any other potential trigger issues
-- Remove and recreate the generic update function to be safe
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate all the updated_at triggers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();