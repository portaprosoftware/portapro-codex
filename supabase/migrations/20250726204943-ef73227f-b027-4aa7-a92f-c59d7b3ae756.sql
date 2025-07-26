-- Phase 1: Database Schema Updates for Service Template Assignment

-- Add template assignment fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS assigned_template_ids jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS default_template_id uuid;

-- Add foreign key constraint for default_template_id
ALTER TABLE public.jobs 
ADD CONSTRAINT fk_jobs_default_template 
FOREIGN KEY (default_template_id) 
REFERENCES public.maintenance_report_templates(id) 
ON DELETE SET NULL;

-- Ensure routine_maintenance_services.default_template_id has proper foreign key
ALTER TABLE public.routine_maintenance_services 
ADD CONSTRAINT fk_routine_services_default_template 
FOREIGN KEY (default_template_id) 
REFERENCES public.maintenance_report_templates(id) 
ON DELETE SET NULL;

-- Add job_id foreign key to maintenance_reports if not exists
ALTER TABLE public.maintenance_reports 
ADD COLUMN IF NOT EXISTS job_id uuid;

ALTER TABLE public.maintenance_reports 
ADD CONSTRAINT fk_maintenance_reports_job 
FOREIGN KEY (job_id) 
REFERENCES public.jobs(id) 
ON DELETE CASCADE;

-- Create index for better performance on template lookups
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_templates ON public.jobs USING GIN (assigned_template_ids);
CREATE INDEX IF NOT EXISTS idx_jobs_default_template ON public.jobs (default_template_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_job ON public.maintenance_reports (job_id);

-- Update RLS policies for maintenance_reports to include job access
DROP POLICY IF EXISTS "Public access" ON public.maintenance_reports;
CREATE POLICY "Public access to maintenance reports" 
ON public.maintenance_reports 
FOR ALL 
USING (true) 
WITH CHECK (true);