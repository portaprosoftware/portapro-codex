-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for message images
CREATE POLICY "Message images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-images');

CREATE POLICY "Authenticated users can upload message images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'message-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their message images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'message-images' AND auth.role() = 'authenticated');

-- Add default logo in marketing setting to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS default_logo_in_marketing boolean DEFAULT true;