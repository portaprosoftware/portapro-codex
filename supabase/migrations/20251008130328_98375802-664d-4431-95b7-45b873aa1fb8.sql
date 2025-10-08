-- Add expiration tracking and custom fields to document system

-- Add expiration requirements to categories
ALTER TABLE public.document_categories 
ADD COLUMN IF NOT EXISTS requires_expiration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_fields_schema JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER DEFAULT 30;

-- Update categories that typically require expiration dates
UPDATE public.document_categories 
SET requires_expiration = true, reminder_days_before = 30
WHERE name IN (
  'Registration',
  'Insurance',
  'Emissions & Inspection Certificates',
  'Permits & Licensing',
  'Driver License & ID',
  'Training Certificates',
  'Warranty Documents',
  'Purchase / Lease Agreements'
);

-- Add custom fields schema for specific categories
UPDATE public.document_categories 
SET custom_fields_schema = '[
  {"name": "policy_number", "label": "Policy Number", "type": "text", "required": true},
  {"name": "coverage_amount", "label": "Coverage Amount", "type": "number", "required": false},
  {"name": "deductible", "label": "Deductible", "type": "number", "required": false}
]'::jsonb
WHERE name = 'Insurance';

UPDATE public.document_categories 
SET custom_fields_schema = '[
  {"name": "license_number", "label": "License Number", "type": "text", "required": true},
  {"name": "license_class", "label": "License Class", "type": "text", "required": true},
  {"name": "restrictions", "label": "Restrictions", "type": "text", "required": false}
]'::jsonb
WHERE name = 'Driver License & ID';

UPDATE public.document_categories 
SET custom_fields_schema = '[
  {"name": "permit_number", "label": "Permit Number", "type": "text", "required": true},
  {"name": "issuing_authority", "label": "Issuing Authority", "type": "text", "required": false}
]'::jsonb
WHERE name = 'Permits & Licensing';

-- Add custom fields to vehicle documents (expiry_date already exists)
ALTER TABLE public.vehicle_documents 
ADD COLUMN IF NOT EXISTS custom_field_values JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_expiration ON public.vehicle_documents(expiry_date) 
WHERE expiry_date IS NOT NULL;

-- Create a view for expiring documents
CREATE OR REPLACE VIEW public.expiring_documents AS
SELECT 
  vd.id,
  vd.vehicle_id,
  vd.category,
  vd.document_name,
  vd.expiry_date as expiration_date,
  vd.file_path,
  vd.reminder_sent,
  v.license_plate,
  dc.reminder_days_before,
  (vd.expiry_date - CURRENT_DATE) as days_until_expiration
FROM public.vehicle_documents vd
JOIN public.vehicles v ON v.id = vd.vehicle_id
JOIN public.document_categories dc ON dc.name = vd.category
WHERE vd.expiry_date IS NOT NULL
  AND vd.expiry_date > CURRENT_DATE
  AND (vd.expiry_date - CURRENT_DATE) <= dc.reminder_days_before
ORDER BY vd.expiry_date ASC;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.document_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  dashboard_alerts BOOLEAN DEFAULT true,
  notification_emails TEXT[] DEFAULT '{}',
  notification_phones TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default notification settings
INSERT INTO public.document_notification_settings (email_notifications, dashboard_alerts)
VALUES (true, true)
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_document_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_document_notification_settings_updated_at ON public.document_notification_settings;

CREATE TRIGGER trigger_update_document_notification_settings_updated_at
BEFORE UPDATE ON public.document_notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_document_notification_settings_updated_at();