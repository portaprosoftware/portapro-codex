-- Scheduling tables
CREATE TABLE IF NOT EXISTS public.shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'route',
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_clerk_id TEXT NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  template_id UUID REFERENCES public.shift_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_clerk_id, shift_date, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_date ON public.driver_shifts(driver_clerk_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_template ON public.driver_shifts(template_id);

-- Training & Certifications tables
CREATE TABLE IF NOT EXISTS public.certification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  valid_months INTEGER,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_clerk_id TEXT NOT NULL,
  certification_type_id UUID NOT NULL REFERENCES public.certification_types(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL,
  expires_on DATE,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_certs_driver ON public.employee_certifications(driver_clerk_id);
CREATE INDEX IF NOT EXISTS idx_employee_certs_type ON public.employee_certifications(certification_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_certs_expires ON public.employee_certifications(expires_on);

CREATE TABLE IF NOT EXISTS public.training_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  certification_type_id UUID NOT NULL REFERENCES public.certification_types(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT true,
  frequency_months INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, certification_type_id)
);

-- Storage bucket for certificates (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Simple updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shift_templates_updated_at ON public.shift_templates;
CREATE TRIGGER trg_shift_templates_updated_at
BEFORE UPDATE ON public.shift_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_driver_shifts_updated_at ON public.driver_shifts;
CREATE TRIGGER trg_driver_shifts_updated_at
BEFORE UPDATE ON public.driver_shifts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_certification_types_updated_at ON public.certification_types;
CREATE TRIGGER trg_certification_types_updated_at
BEFORE UPDATE ON public.certification_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employee_certifications_updated_at ON public.employee_certifications;
CREATE TRIGGER trg_employee_certifications_updated_at
BEFORE UPDATE ON public.employee_certifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_training_requirements_updated_at ON public.training_requirements;
CREATE TRIGGER trg_training_requirements_updated_at
BEFORE UPDATE ON public.training_requirements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();