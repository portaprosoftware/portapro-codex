-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-images', 'vehicle-images', true);

-- Create policies for vehicle images
CREATE POLICY "Allow public access to vehicle images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Allow authenticated users to upload vehicle images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Allow authenticated users to update vehicle images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Allow authenticated users to delete vehicle images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vehicle-images');