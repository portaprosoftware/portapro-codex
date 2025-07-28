-- Fix duplicate foreign key relationships causing 400 errors in maintenance_reports queries

-- Drop the duplicate foreign key constraint we just added
ALTER TABLE public.maintenance_reports 
DROP CONSTRAINT IF EXISTS maintenance_reports_job_id_fkey;

-- Drop the duplicate customer foreign key as well if it exists
ALTER TABLE public.maintenance_reports 
DROP CONSTRAINT IF EXISTS maintenance_reports_customer_id_fkey;

-- Keep only the original foreign key constraints and ensure proper naming
-- The original constraint should be fk_maintenance_reports_job based on the error message