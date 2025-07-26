-- Add attachment support to driver time off requests
ALTER TABLE public.driver_time_off_requests 
ADD COLUMN attachment_url TEXT;

-- Create storage bucket for driver documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('driver-documents', 'driver-documents', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for driver documents
CREATE POLICY "Public access to driver documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can upload driver documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'driver-documents');

CREATE POLICY "Users can update their own driver documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'driver-documents');

CREATE POLICY "Users can delete their own driver documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'driver-documents');