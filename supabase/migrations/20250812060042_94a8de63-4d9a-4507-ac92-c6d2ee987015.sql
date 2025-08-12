-- Phase 1: Database Schema Enhancement for Driver Profile System
-- No RLS policies since using Clerk authentication

-- 1. Enhance existing profiles table with driver-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_effective_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_base TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for driver_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_driver_id ON public.profiles(driver_id);

-- Create index for supervisor relationships
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor_id ON public.profiles(supervisor_id);

-- 2. Create driver_credentials table
CREATE TABLE IF NOT EXISTS public.driver_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  license_state TEXT,
  license_class TEXT,
  license_endorsements TEXT[],
  license_expiry_date DATE,
  license_image_url TEXT,
  medical_card_reference TEXT,
  medical_card_expiry_date DATE,
  medical_card_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for credentials
CREATE INDEX IF NOT EXISTS idx_driver_credentials_driver_id ON public.driver_credentials(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_credentials_license_expiry ON public.driver_credentials(license_expiry_date);
CREATE INDEX IF NOT EXISTS idx_driver_credentials_medical_expiry ON public.driver_credentials(medical_card_expiry_date);

-- 3. Create driver_devices table
CREATE TABLE IF NOT EXISTS public.driver_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  telematics_provider TEXT,
  driver_tag_id TEXT,
  app_access_connected BOOLEAN DEFAULT false,
  app_last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for devices
CREATE INDEX IF NOT EXISTS idx_driver_devices_driver_id ON public.driver_devices(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_devices_tag_id ON public.driver_devices(driver_tag_id);

-- 4. Create enhanced driver_training_records table (replace existing if needed)
DROP TABLE IF EXISTS public.driver_training_records CASCADE;
CREATE TABLE public.driver_training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL,
  last_completed DATE,
  next_due DATE,
  certificate_url TEXT,
  instructor_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for training records
CREATE INDEX IF NOT EXISTS idx_driver_training_driver_id ON public.driver_training_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_training_type ON public.driver_training_records(training_type);
CREATE INDEX IF NOT EXISTS idx_driver_training_next_due ON public.driver_training_records(next_due);

-- 5. Create driver_equipment_qualifications table
CREATE TABLE IF NOT EXISTS public.driver_equipment_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL,
  qualified_date DATE,
  qualification_expires DATE,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for equipment qualifications
CREATE INDEX IF NOT EXISTS idx_driver_equipment_driver_id ON public.driver_equipment_qualifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_equipment_type ON public.driver_equipment_qualifications(equipment_type);
CREATE INDEX IF NOT EXISTS idx_driver_equipment_expires ON public.driver_equipment_qualifications(qualification_expires);

-- 6. Create driver_ppe_info table
CREATE TABLE IF NOT EXISTS public.driver_ppe_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  glove_size TEXT,
  vest_size TEXT,
  hard_hat_size TEXT,
  boot_size TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for PPE info
CREATE INDEX IF NOT EXISTS idx_driver_ppe_driver_id ON public.driver_ppe_info(driver_id);

-- 7. Create driver_activity_log table
CREATE TABLE IF NOT EXISTS public.driver_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_driver_activity_driver_id ON public.driver_activity_log(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_activity_type ON public.driver_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_driver_activity_performed_by ON public.driver_activity_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_driver_activity_created_at ON public.driver_activity_log(created_at);

-- 8. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_driver_credentials_updated_at
    BEFORE UPDATE ON public.driver_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_devices_updated_at
    BEFORE UPDATE ON public.driver_devices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_training_updated_at
    BEFORE UPDATE ON public.driver_training_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_equipment_updated_at
    BEFORE UPDATE ON public.driver_equipment_qualifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_ppe_updated_at
    BEFORE UPDATE ON public.driver_ppe_info
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create unique constraints where needed
ALTER TABLE public.driver_credentials ADD CONSTRAINT unique_driver_credentials UNIQUE (driver_id);
ALTER TABLE public.driver_devices ADD CONSTRAINT unique_driver_devices UNIQUE (driver_id);
ALTER TABLE public.driver_ppe_info ADD CONSTRAINT unique_driver_ppe UNIQUE (driver_id);

-- Add unique constraint for driver_id in profiles if it doesn't exist
ALTER TABLE public.profiles ADD CONSTRAINT unique_driver_id UNIQUE (driver_id);

-- 10. Add check constraints for valid enum values
ALTER TABLE public.profiles ADD CONSTRAINT check_status_valid 
CHECK (status IN ('active', 'on_leave', 'terminated'));

ALTER TABLE public.driver_credentials ADD CONSTRAINT check_license_class_valid 
CHECK (license_class IN ('CDL', 'Non-CDL', 'CDL-A', 'CDL-B', 'CDL-C'));

-- Add comments for documentation
COMMENT ON TABLE public.driver_credentials IS 'Stores driver license and medical certification information';
COMMENT ON TABLE public.driver_devices IS 'Stores driver device and access information';
COMMENT ON TABLE public.driver_training_records IS 'Tracks driver training completion and due dates';
COMMENT ON TABLE public.driver_equipment_qualifications IS 'Tracks driver equipment operation qualifications';
COMMENT ON TABLE public.driver_ppe_info IS 'Stores driver personal protective equipment sizing';
COMMENT ON TABLE public.driver_activity_log IS 'Logs all driver profile related activities for audit purposes';