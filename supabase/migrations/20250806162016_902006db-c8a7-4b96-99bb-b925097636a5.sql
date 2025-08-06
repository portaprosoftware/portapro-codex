-- Add missing columns for custom messages and recipient data to marketing_campaigns table
ALTER TABLE public.marketing_campaigns 
ADD COLUMN IF NOT EXISTS message_source text DEFAULT 'template',
ADD COLUMN IF NOT EXISTS custom_subject text,
ADD COLUMN IF NOT EXISTS custom_content text,
ADD COLUMN IF NOT EXISTS custom_message_data jsonb,
ADD COLUMN IF NOT EXISTS target_customers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recipient_type text DEFAULT 'all';