-- Fix storage table RLS policies by enabling RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;