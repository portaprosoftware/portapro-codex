-- Create storage bucket for QR feedback photos
INSERT INTO storage.buckets (id, name, public) VALUES ('qr-feedback-photos', 'qr-feedback-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for QR feedback photos
CREATE POLICY "Anyone can upload QR feedback photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'qr-feedback-photos');

CREATE POLICY "QR feedback photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'qr-feedback-photos');