-- Add columns for dual content support in communication templates
ALTER TABLE public.communication_templates 
ADD COLUMN email_content TEXT,
ADD COLUMN sms_content TEXT;

-- Update the type enum to include 'both'
ALTER TABLE public.communication_templates 
ADD CONSTRAINT check_template_type CHECK (type IN ('email', 'sms', 'both'));

-- Migrate existing data: copy content to appropriate new columns
UPDATE public.communication_templates 
SET email_content = content 
WHERE type = 'email';

UPDATE public.communication_templates 
SET sms_content = content 
WHERE type = 'sms';

-- For templates that might have been created as 'both' already, set both fields
UPDATE public.communication_templates 
SET email_content = content, sms_content = content 
WHERE email_content IS NULL AND sms_content IS NULL;