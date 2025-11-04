-- Add SMS from number to company settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS sms_from_number TEXT;

COMMENT ON COLUMN public.company_settings.sms_from_number IS 'Twilio phone number used for sending SMS notifications to customers';