-- Add delivery fee settings to company_settings table
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS default_delivery_fee NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS auto_enable_delivery_fee BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.company_settings.default_delivery_fee IS 'Default delivery fee amount for jobs and quotes';
COMMENT ON COLUMN public.company_settings.auto_enable_delivery_fee IS 'Automatically enable delivery fee on services step';