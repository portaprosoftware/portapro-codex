-- Create storage bucket for vehicle images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public access to vehicle images
CREATE POLICY "Public access to vehicle images" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicle-images');

-- Create policy to allow authenticated users to upload vehicle images
CREATE POLICY "Authenticated users can upload vehicle images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vehicle-images');

-- Create policy to allow authenticated users to update vehicle images
CREATE POLICY "Authenticated users can update vehicle images" ON storage.objects
FOR UPDATE USING (bucket_id = 'vehicle-images');

-- Create policy to allow authenticated users to delete vehicle images
CREATE POLICY "Authenticated users can delete vehicle images" ON storage.objects
FOR DELETE USING (bucket_id = 'vehicle-images');