-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE,
  clerk_user_id TEXT UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vehicles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate TEXT NOT NULL,
  vehicle_type TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_report_templates table
CREATE TABLE IF NOT EXISTS public.service_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT,
  version TEXT DEFAULT '1.0',
  is_default_for_type BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sections JSONB DEFAULT '[]'::jsonb,
  logic_rules JSONB,
  permissions JSONB,
  output_config JSONB,
  organization_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  job_id UUID,
  customer_id UUID,
  site_id UUID,
  unit_id UUID,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  created_by TEXT,
  automation_rule_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fuel_logs table
CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  log_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  odometer_reading INTEGER NOT NULL,
  gallons_purchased NUMERIC(10,2) NOT NULL,
  cost_per_gallon NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(10,2) NOT NULL,
  fuel_station TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_report_templates_org ON public.service_report_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_report_templates_active ON public.service_report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_job ON public.maintenance_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON public.maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle ON public.fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_driver ON public.fuel_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON public.fuel_logs(log_date);

-- Create or replace the update_updated_at_column trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_report_templates_updated_at ON public.service_report_templates;
CREATE TRIGGER update_service_report_templates_updated_at
  BEFORE UPDATE ON public.service_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_tasks_updated_at ON public.maintenance_tasks;
CREATE TRIGGER update_maintenance_tasks_updated_at
  BEFORE UPDATE ON public.maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fuel_logs_updated_at ON public.fuel_logs;
CREATE TRIGGER update_fuel_logs_updated_at
  BEFORE UPDATE ON public.fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();