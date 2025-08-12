-- Phase 7: Backend Integration - Services Hub Schema Updates

-- Create services table for Service Catalog
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  description text,
  category text NOT NULL CHECK (category IN ('cleaning', 'maintenance', 'emergency', 'inspection')),
  pricing_method text CHECK (pricing_method IN ('per_visit', 'per_hour', 'included')),
  default_rate numeric,
  estimated_duration_minutes integer,
  default_template_id uuid REFERENCES public.maintenance_report_templates(id),
  consumables_recipe jsonb DEFAULT '[]'::jsonb,
  evidence_requirements jsonb DEFAULT '{}'::jsonb,
  eligible_targets jsonb DEFAULT '{}'::jsonb,
  can_be_recurring boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add source tracking to maintenance_reports table
ALTER TABLE public.maintenance_reports 
ADD COLUMN IF NOT EXISTS source_type text CHECK (source_type IN ('job', 'work_order', 'manual')),
ADD COLUMN IF NOT EXISTS source_id uuid,
ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id),
ADD COLUMN IF NOT EXISTS auto_generated boolean DEFAULT false;

-- Add service_id to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id);

-- Create function to auto-generate service record on job completion
CREATE OR REPLACE FUNCTION public.auto_generate_service_record_on_job_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  service_record RECORD;
  template_id uuid;
BEGIN
  -- Only trigger when job status changes to 'completed' and service_id exists
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.service_id IS NOT NULL THEN
    
    -- Get the default template for this service
    SELECT default_template_id INTO template_id 
    FROM public.services 
    WHERE id = NEW.service_id;
    
    -- Create auto-generated service record
    INSERT INTO public.maintenance_reports (
      report_number,
      template_id,
      job_id,
      source_type,
      source_id,
      service_id,
      auto_generated,
      status,
      created_at
    ) VALUES (
      'AUTO-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0'),
      template_id,
      NEW.id,
      'job',
      NEW.id,
      NEW.service_id,
      true,
      'draft',
      now()
    );
    
    -- Log the auto-generation
    RAISE LOG 'Auto-generated service record for job % with service %', NEW.id, NEW.service_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for job completion
DROP TRIGGER IF EXISTS trigger_auto_generate_service_record ON public.jobs;
CREATE TRIGGER trigger_auto_generate_service_record
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_service_record_on_job_completion();

-- Insert some default services for the catalog
INSERT INTO public.services (name, code, description, category, pricing_method, default_rate, estimated_duration_minutes, consumables_recipe, evidence_requirements, eligible_targets, can_be_recurring) VALUES
('Standard Cleaning', 'STD-CLEAN', 'Basic cleaning and sanitization service', 'cleaning', 'per_visit', 25.00, 30, '[]'::jsonb, '{"photos": true, "signature": true}'::jsonb, '{"units": ["portable_toilet", "handwash_station"]}'::jsonb, true),
('Deep Clean Service', 'DEEP-CLEAN', 'Thorough deep cleaning and disinfection', 'cleaning', 'per_visit', 45.00, 60, '[]'::jsonb, '{"photos": true, "signature": true, "checklist": true}'::jsonb, '{"units": ["portable_toilet", "luxury_unit"]}'::jsonb, false),
('Routine Maintenance', 'ROUTINE-MAINT', 'Standard maintenance and inspection', 'maintenance', 'per_visit', 35.00, 45, '[]'::jsonb, '{"photos": true, "parts_list": true}'::jsonb, '{"units": ["all"], "vehicles": ["truck", "trailer"]}'::jsonb, true),
('Emergency Repair', 'EMERG-REPAIR', 'Emergency repair service', 'emergency', 'per_hour', 75.00, 120, '[]'::jsonb, '{"photos": true, "repair_notes": true, "parts_list": true}'::jsonb, '{"units": ["all"], "vehicles": ["all"]}'::jsonb, false),
('Safety Inspection', 'SAFETY-INSP', 'Comprehensive safety and compliance inspection', 'inspection', 'per_visit', 50.00, 90, '[]'::jsonb, '{"photos": true, "checklist": true, "signature": true}'::jsonb, '{"units": ["all"], "vehicles": ["all"]}'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- Add updated_at trigger for services table
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();