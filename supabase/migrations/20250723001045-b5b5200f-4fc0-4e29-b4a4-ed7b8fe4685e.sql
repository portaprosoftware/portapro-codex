
-- Create business_hours table for company operating hours
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'dispatch', 'driver', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  job_assignments BOOLEAN DEFAULT true,
  maintenance_alerts BOOLEAN DEFAULT true,
  invoice_reminders BOOLEAN DEFAULT true,
  quote_updates BOOLEAN DEFAULT true,
  system_updates BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  phone_number TEXT,
  email_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('volume_discount', 'seasonal', 'customer_type', 'duration_based')),
  conditions JSONB NOT NULL DEFAULT '{}',
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (since we're using Clerk for auth)
CREATE POLICY "Public access to business hours" ON public.business_hours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to user roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to notification preferences" ON public.notification_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to pricing rules" ON public.pricing_rules FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_business_hours_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_business_hours_updated_at
    BEFORE UPDATE ON public.business_hours
    FOR EACH ROW
    EXECUTE FUNCTION public.update_business_hours_updated_at();

CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_roles_updated_at();

CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_notification_preferences_updated_at();

CREATE OR REPLACE FUNCTION public.update_pricing_rules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON public.pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pricing_rules_updated_at();

-- Insert default business hours (closed by default)
INSERT INTO public.business_hours (day_of_week, is_open, open_time, close_time) VALUES
(0, false, '09:00', '17:00'), -- Sunday
(1, true, '08:00', '17:00'),  -- Monday
(2, true, '08:00', '17:00'),  -- Tuesday
(3, true, '08:00', '17:00'),  -- Wednesday
(4, true, '08:00', '17:00'),  -- Thursday
(5, true, '08:00', '17:00'),  -- Friday
(6, false, '09:00', '17:00')  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert default company settings if none exist
INSERT INTO public.company_settings (id, company_name) 
SELECT gen_random_uuid(), 'PortaPro Company'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);
