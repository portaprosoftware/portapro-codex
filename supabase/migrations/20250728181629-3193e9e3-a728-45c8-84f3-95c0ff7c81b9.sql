-- Fix duplicate foreign key relationships causing 400 errors in routine_maintenance_services queries
-- Drop all duplicate constraints that might be causing the ambiguity

-- Drop any extra constraints that might exist
ALTER TABLE public.routine_maintenance_services 
DROP CONSTRAINT IF EXISTS routine_maintenance_services_default_template_id_fkey;

ALTER TABLE public.routine_maintenance_services 
DROP CONSTRAINT IF EXISTS fk_routine_services_default_template;