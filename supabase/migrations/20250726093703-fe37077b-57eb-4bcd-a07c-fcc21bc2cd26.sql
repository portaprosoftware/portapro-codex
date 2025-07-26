-- Phase 1: Database Schema Enhancements for Fleet Maintenance Module

-- Create maintenance task types table
CREATE TABLE public.maintenance_task_types (
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
CREATE TABLE public.maintenance_vendors (
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
CREATE TABLE public.maintenance_technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
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
CREATE TABLE public.maintenance_parts (
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
CREATE TABLE public.maintenance_parts_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.maintenance_parts(id),
  quantity_used INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance notification schedules table
CREATE TABLE public.maintenance_notification_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- '7_day_reminder', 'day_of_reminder', 'overdue_alert', 'mileage_reminder'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing maintenance_records table
ALTER TABLE public.maintenance_records 
ADD COLUMN task_type_id UUID REFERENCES public.maintenance_task_types(id),
ADD COLUMN vendor_id UUID REFERENCES public.maintenance_vendors(id),
ADD COLUMN technician_id UUID REFERENCES public.maintenance_technicians(id),
ADD COLUMN estimated_hours NUMERIC,
ADD COLUMN actual_hours NUMERIC,
ADD COLUMN priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
ADD COLUMN parts_cost NUMERIC DEFAULT 0,
ADD COLUMN labor_cost NUMERIC DEFAULT 0,
ADD COLUMN total_cost NUMERIC GENERATED ALWAYS AS (COALESCE(parts_cost, 0) + COALESCE(labor_cost, 0)) STORED;

-- Create company maintenance settings table
CREATE TABLE public.company_maintenance_settings (
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

-- Insert default maintenance task types
INSERT INTO public.maintenance_task_types (name, description, default_interval_miles, default_interval_days, default_cost) VALUES
('Oil Change', 'Regular engine oil and filter change', 5000, 90, 50.00),
('Tire Rotation', 'Rotate tires to ensure even wear', 7500, 120, 30.00),
('Brake Inspection', 'Inspect brake pads, rotors, and fluid', 15000, 180, 75.00),
('DOT Inspection', 'Department of Transportation annual inspection', NULL, 365, 150.00),
('Transmission Service', 'Transmission fluid change and inspection', 30000, 365, 200.00),
('Air Filter Replacement', 'Replace engine air filter', 15000, 180, 25.00),
('Coolant Flush', 'Replace engine coolant', 30000, 730, 100.00),
('Battery Check', 'Test battery and charging system', NULL, 90, 0.00);

-- Insert default company maintenance settings
INSERT INTO public.company_maintenance_settings (enable_inhouse_features) VALUES (false);

-- Enable RLS on all new tables
ALTER TABLE public.maintenance_task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public access for now, can be refined later)
CREATE POLICY "Public access to maintenance task types" ON public.maintenance_task_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to maintenance vendors" ON public.maintenance_vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to maintenance technicians" ON public.maintenance_technicians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to maintenance parts" ON public.maintenance_parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to maintenance parts usage" ON public.maintenance_parts_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to maintenance notification schedules" ON public.maintenance_notification_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to company maintenance settings" ON public.company_maintenance_settings FOR ALL USING (true) WITH CHECK (true);

-- Create update triggers for timestamps
CREATE TRIGGER update_maintenance_task_types_updated_at
  BEFORE UPDATE ON public.maintenance_task_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_vendors_updated_at
  BEFORE UPDATE ON public.maintenance_vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_technicians_updated_at
  BEFORE UPDATE ON public.maintenance_technicians
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_parts_updated_at
  BEFORE UPDATE ON public.maintenance_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_maintenance_settings_updated_at
  BEFORE UPDATE ON public.company_maintenance_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get maintenance KPIs
CREATE OR REPLACE FUNCTION public.get_maintenance_kpis()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  past_due_count INTEGER;
  due_this_week_count INTEGER;
  in_progress_count INTEGER;
  ytd_spend NUMERIC;
  result jsonb;
BEGIN
  -- Count past due maintenance
  SELECT COUNT(*) INTO past_due_count
  FROM public.maintenance_records
  WHERE scheduled_date < CURRENT_DATE
    AND status IN ('scheduled', 'in_progress');
  
  -- Count due this week
  SELECT COUNT(*) INTO due_this_week_count
  FROM public.maintenance_records
  WHERE scheduled_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
    AND status = 'scheduled';
  
  -- Count in progress
  SELECT COUNT(*) INTO in_progress_count
  FROM public.maintenance_records
  WHERE status = 'in_progress';
  
  -- Calculate YTD spend
  SELECT COALESCE(SUM(total_cost), 0) INTO ytd_spend
  FROM public.maintenance_records
  WHERE EXTRACT(YEAR FROM completed_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status = 'completed';
  
  result := jsonb_build_object(
    'past_due', past_due_count,
    'due_this_week', due_this_week_count,
    'in_progress', in_progress_count,
    'ytd_spend', ytd_spend
  );
  
  RETURN result;
END;
$$;