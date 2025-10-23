-- Create storage bucket for Apple Wallet passes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wallet-passes',
  'wallet-passes',
  true,
  10485760, -- 10MB limit
  ARRAY['application/vnd.apple.pkpass']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for wallet-passes bucket
CREATE POLICY "Public read access for wallet passes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'wallet-passes');

CREATE POLICY "Authenticated users can upload wallet passes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'wallet-passes');

CREATE POLICY "Authenticated users can update wallet passes"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'wallet-passes');

CREATE POLICY "Authenticated users can delete wallet passes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'wallet-passes');