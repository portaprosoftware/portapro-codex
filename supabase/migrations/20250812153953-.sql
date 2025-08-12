-- Create storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('driver-documents', 'driver-documents', false);

-- Create storage policies for driver documents
CREATE POLICY "Allow authenticated users to upload driver documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'driver-documents');

CREATE POLICY "Allow authenticated users to view driver documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'driver-documents');

CREATE POLICY "Allow authenticated users to delete driver documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'driver-documents');