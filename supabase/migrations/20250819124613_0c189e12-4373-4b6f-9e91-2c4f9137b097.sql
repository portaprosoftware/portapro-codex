-- Create storage bucket for unit photos
INSERT INTO storage.buckets (id, name, public) VALUES ('unit-photos', 'unit-photos', true);

-- Create policies for unit photos bucket
CREATE POLICY "Unit photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'unit-photos');

CREATE POLICY "Users can upload unit photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'unit-photos');

CREATE POLICY "Users can update unit photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'unit-photos');

CREATE POLICY "Users can delete unit photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'unit-photos');