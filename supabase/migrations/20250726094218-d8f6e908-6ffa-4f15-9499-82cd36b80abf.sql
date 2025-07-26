-- Phase 1B: Add missing components for Fleet Maintenance Module

-- Create maintenance task types table
CREATE TABLE IF NOT EXISTS public.maintenance_task_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_interval_miles INTEGER,
  default_interval_days INTEGER,
  default_cost NUMERIC DEFAULT 0,
  required_technician_role TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance vendors table
CREATE TABLE IF NOT EXISTS public.maintenance_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  service_specialties TEXT[],
  hourly_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance technicians table (for in-house staff)
CREATE TABLE IF NOT EXISTS public.maintenance_technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  employee_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specializations TEXT[],
  hourly_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  hired_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance parts table (for in-house inventory)
CREATE TABLE IF NOT EXISTS public.maintenance_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_cost NUMERIC DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  storage_location_id UUID,
  supplier_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance parts usage tracking
CREATE TABLE IF NOT EXISTS public.maintenance_parts_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.maintenance_parts(id),
  quantity_used INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company maintenance settings table
CREATE TABLE IF NOT EXISTS public.company_maintenance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enable_inhouse_features BOOLEAN DEFAULT false,
  default_notification_advance_days INTEGER DEFAULT 7,
  notification_send_time TIME DEFAULT '08:00',
  notification_email TEXT,
  notification_phone TEXT,
  data_retention_days INTEGER DEFAULT 2555, -- 7 years
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing maintenance_records table if they don't exist
DO $$ 
BEGIN
  -- Add task_type_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'task_type_id') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN task_type_id UUID REFERENCES public.maintenance_task_types(id);
  END IF;
  
  -- Add vendor_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'vendor_id') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN vendor_id UUID REFERENCES public.maintenance_vendors(id);
  END IF;
  
  -- Add technician_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'technician_id') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN technician_id UUID REFERENCES public.maintenance_technicians(id);
  END IF;
  
  -- Add other missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'estimated_hours') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN estimated_hours NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'actual_hours') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN actual_hours NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'priority') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'parts_cost') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN parts_cost NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'labor_cost') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN labor_cost NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'total_cost') THEN
    ALTER TABLE public.maintenance_records ADD COLUMN total_cost NUMERIC GENERATED ALWAYS AS (COALESCE(parts_cost, 0) + COALESCE(labor_cost, 0)) STORED;
  END IF;
END $$;

-- Insert default maintenance task types if the table is empty
INSERT INTO public.maintenance_task_types (name, description, default_interval_miles, default_interval_days, default_cost) 
SELECT * FROM (VALUES
  ('Oil Change', 'Regular engine oil and filter change', 5000, 90, 50.00),
  ('Tire Rotation', 'Rotate tires to ensure even wear', 7500, 120, 30.00),
  ('Brake Inspection', 'Inspect brake pads, rotors, and fluid', 15000, 180, 75.00),
  ('DOT Inspection', 'Department of Transportation annual inspection', NULL, 365, 150.00),
  ('Transmission Service', 'Transmission fluid change and inspection', 30000, 365, 200.00),
  ('Air Filter Replacement', 'Replace engine air filter', 15000, 180, 25.00),
  ('Coolant Flush', 'Replace engine coolant', 30000, 730, 100.00),
  ('Battery Check', 'Test battery and charging system', NULL, 90, 0.00)
) AS v(name, description, default_interval_miles, default_interval_days, default_cost)
WHERE NOT EXISTS (SELECT 1 FROM public.maintenance_task_types);

-- Insert default company maintenance settings if not exists
INSERT INTO public.company_maintenance_settings (enable_inhouse_features) 
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM public.company_maintenance_settings);

-- Enable RLS on new tables
ALTER TABLE public.maintenance_task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Public access to maintenance task types" ON public.maintenance_task_types;
CREATE POLICY "Public access to maintenance task types" ON public.maintenance_task_types FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to maintenance vendors" ON public.maintenance_vendors;
CREATE POLICY "Public access to maintenance vendors" ON public.maintenance_vendors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to maintenance technicians" ON public.maintenance_technicians;
CREATE POLICY "Public access to maintenance technicians" ON public.maintenance_technicians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to maintenance parts" ON public.maintenance_parts;
CREATE POLICY "Public access to maintenance parts" ON public.maintenance_parts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to maintenance parts usage" ON public.maintenance_parts_usage;
CREATE POLICY "Public access to maintenance parts usage" ON public.maintenance_parts_usage FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to company maintenance settings" ON public.company_maintenance_settings;
CREATE POLICY "Public access to company maintenance settings" ON public.company_maintenance_settings FOR ALL USING (true) WITH CHECK (true);