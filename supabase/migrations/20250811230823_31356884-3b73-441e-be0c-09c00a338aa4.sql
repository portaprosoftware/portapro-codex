-- Add profile_photo column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_photo text;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- Since no RLS is used, we'll create basic policies for public access
CREATE POLICY "Profile photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can upload profile photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can update profile photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can delete profile photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-photos');