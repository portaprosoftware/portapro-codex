-- Add default deposit percentage to company settings
ALTER TABLE public.company_settings 
ADD COLUMN default_deposit_percentage numeric DEFAULT 25.00 
CHECK (default_deposit_percentage >= 0 AND default_deposit_percentage <= 100);

COMMENT ON COLUMN public.company_settings.default_deposit_percentage 
IS 'Default percentage for deposit collection when creating quotes/jobs';