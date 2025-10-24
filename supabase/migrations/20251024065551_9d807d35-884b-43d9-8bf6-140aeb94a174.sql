-- Create has_role function with correct types (user_id is TEXT in user_roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create enum for template types
DO $$ BEGIN
  CREATE TYPE public.template_type AS ENUM ('delivery', 'service', 'pickup', 'repair', 'inspection', 'event');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create table for service report templates
CREATE TABLE IF NOT EXISTS public.service_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type template_type NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_default_for_type BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Template structure (JSONB for flexibility)
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  logic_rules JSONB NOT NULL DEFAULT '{
    "per_unit_loop": false,
    "auto_requirements": [],
    "default_values": {},
    "fee_suggestions": []
  }'::jsonb,
  permissions JSONB NOT NULL DEFAULT '{
    "tech_editable_fields": ["*"],
    "office_editable_fields": ["*"],
    "internal_only_fields": []
  }'::jsonb,
  output_config JSONB NOT NULL DEFAULT '{
    "pdf_layout": "summary_first",
    "customer_pdf_fields": [],
    "internal_pdf_fields": [],
    "photo_grid_columns": 2,
    "watermark": "",
    "show_brand_header": true
  }'::jsonb,
  
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, name, version)
);

-- Enable RLS
ALTER TABLE public.service_report_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view templates in their organization" ON public.service_report_templates;
DROP POLICY IF EXISTS "Owners can insert templates" ON public.service_report_templates;
DROP POLICY IF EXISTS "Owners can update templates" ON public.service_report_templates;
DROP POLICY IF EXISTS "Owners can delete templates" ON public.service_report_templates;

-- Policies for service_report_templates
CREATE POLICY "Users can view templates in their organization"
  ON public.service_report_templates
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()::text
    )
  );

CREATE POLICY "Owners can insert templates"
  ON public.service_report_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()::text
    )
    AND public.has_role(auth.uid()::text, 'owner'::app_role)
  );

CREATE POLICY "Owners can update templates"
  ON public.service_report_templates
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()::text
    )
    AND public.has_role(auth.uid()::text, 'owner'::app_role)
  );

CREATE POLICY "Owners can delete templates"
  ON public.service_report_templates
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()::text
    )
    AND public.has_role(auth.uid()::text, 'owner'::app_role)
  );

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_service_report_templates_updated_at ON public.service_report_templates;
CREATE TRIGGER update_service_report_templates_updated_at
  BEFORE UPDATE ON public.service_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_report_templates_org_type 
  ON public.service_report_templates(organization_id, template_type);

CREATE INDEX IF NOT EXISTS idx_service_report_templates_default 
  ON public.service_report_templates(organization_id, template_type, is_default_for_type) 
  WHERE is_default_for_type = true;