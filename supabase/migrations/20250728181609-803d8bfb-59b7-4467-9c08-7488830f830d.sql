-- Fix duplicate foreign key relationships causing 400 errors in routine_maintenance_services queries

-- First, let's check what foreign key constraints exist
-- Drop any duplicate constraints that might exist
ALTER TABLE public.routine_maintenance_services 
DROP CONSTRAINT IF EXISTS routine_maintenance_services_default_template_id_fkey;

-- Drop the other potential duplicate constraint 
ALTER TABLE public.routine_maintenance_services 
DROP CONSTRAINT IF EXISTS fk_routine_services_default_template;

-- Add back the proper foreign key constraint with a clear name
ALTER TABLE public.routine_maintenance_services 
ADD CONSTRAINT fk_routine_maintenance_services_default_template_id
FOREIGN KEY (default_template_id) 
REFERENCES public.maintenance_report_templates(id);