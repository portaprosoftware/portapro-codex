-- Add default_template_id to routine_maintenance_services
ALTER TABLE public.routine_maintenance_services 
ADD COLUMN default_template_id uuid REFERENCES public.maintenance_report_templates(id) ON DELETE SET NULL;

-- Add is_public flag to maintenance_report_templates
ALTER TABLE public.maintenance_report_templates 
ADD COLUMN is_public boolean DEFAULT true;

-- Add index for better performance
CREATE INDEX idx_routine_maintenance_services_default_template 
ON public.routine_maintenance_services(default_template_id);

-- Add index for public templates query
CREATE INDEX idx_maintenance_report_templates_is_public 
ON public.maintenance_report_templates(is_public) WHERE is_public = true;