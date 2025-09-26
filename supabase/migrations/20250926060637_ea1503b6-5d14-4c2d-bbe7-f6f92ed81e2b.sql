-- Create incident severity enum
DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM ('minor', 'moderate', 'major', 'reportable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create configurable spill types table
CREATE TABLE IF NOT EXISTS public.configurable_spill_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default spill types if table is empty
INSERT INTO public.configurable_spill_types (name, category, subcategory) 
SELECT 'Gasoline', 'fuel', 'petroleum'
WHERE NOT EXISTS (SELECT 1 FROM public.configurable_spill_types WHERE name = 'Gasoline');

INSERT INTO public.configurable_spill_types (name, category, subcategory) VALUES
('Diesel', 'fuel', 'petroleum'),
('Hydraulic Fluid', 'fuel', 'hydraulic'),
('Septage', 'septage', 'wastewater'),
('Portable Toilet Blue', 'septage', 'chemical'),
('Grease Trap Waste', 'septage', 'organic'),
('Disinfectant', 'chemical', 'cleaning'),
('Bleach', 'chemical', 'cleaning'),
('Acidic Cleaner', 'chemical', 'cleaning'),
('Water', 'water', 'clean'),
('Other', 'other', null)
ON CONFLICT DO NOTHING;

-- Create incident witnesses table
CREATE TABLE IF NOT EXISTS public.incident_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.spill_incident_reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create incident photos table
CREATE TABLE IF NOT EXISTS public.incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.spill_incident_reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create incident follow-up actions table
CREATE TABLE IF NOT EXISTS public.incident_follow_up_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.spill_incident_reports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to existing spill_incident_reports table
ALTER TABLE public.spill_incident_reports 
ADD COLUMN IF NOT EXISTS severity incident_severity DEFAULT 'minor',
ADD COLUMN IF NOT EXISTS volume_estimate NUMERIC,
ADD COLUMN IF NOT EXISTS volume_unit TEXT DEFAULT 'gallons',
ADD COLUMN IF NOT EXISTS weather_conditions TEXT,
ADD COLUMN IF NOT EXISTS responsible_party TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS cleanup_actions TEXT[],
ADD COLUMN IF NOT EXISTS witnesses_present BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_notification_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS assigned_to TEXT,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;