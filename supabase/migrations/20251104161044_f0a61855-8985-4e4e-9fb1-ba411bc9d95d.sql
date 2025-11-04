-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to logos" ON storage.objects;

-- Create public policies for company-logos bucket (UI is guarded by Clerk)
CREATE POLICY "Public can upload logos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Public can update logos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'company-logos');

CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

CREATE POLICY "Public can delete logos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'company-logos');