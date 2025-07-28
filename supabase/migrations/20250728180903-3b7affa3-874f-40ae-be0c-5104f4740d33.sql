-- Fix missing foreign key relationships for maintenance_reports table that are causing 400 errors

-- First, check if these columns exist and add foreign key constraints
-- Add foreign key for jobs table relationship
ALTER TABLE public.maintenance_reports 
ADD CONSTRAINT maintenance_reports_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Add foreign key for customer relationship  
ALTER TABLE public.maintenance_reports 
ADD CONSTRAINT maintenance_reports_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Add foreign key for template relationship
ALTER TABLE public.maintenance_reports 
ADD CONSTRAINT maintenance_reports_template_id_fkey 
FOREIGN KEY (template_id) REFERENCES public.maintenance_report_templates(id) ON DELETE SET NULL;

-- Add foreign key for technician relationship (if exists)
-- ALTER TABLE public.maintenance_reports 
-- ADD CONSTRAINT maintenance_reports_technician_id_fkey 
-- FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;