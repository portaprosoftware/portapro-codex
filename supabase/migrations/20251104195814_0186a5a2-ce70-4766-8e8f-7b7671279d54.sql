-- Create storage bucket for work order photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-order-photos',
  'work-order-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS Policies for work-order-photos bucket

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload work order photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-photos' AND
  (storage.foldername(name))[1] = 'work-orders'
);

-- Allow authenticated users to view all work order photos
CREATE POLICY "Authenticated users can view work order photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'work-order-photos');

-- Allow users to update their own uploaded photos
CREATE POLICY "Users can update their own work order photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'work-order-photos')
WITH CHECK (bucket_id = 'work-order-photos');

-- Allow users to delete their own uploaded photos
CREATE POLICY "Users can delete work order photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'work-order-photos');

-- Create table to track photo metadata
CREATE TABLE IF NOT EXISTS public.work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'progress', 'issue')),
  caption TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_size INTEGER,
  mime_type TEXT
);

-- Enable RLS on work_order_photos
ALTER TABLE public.work_order_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_order_photos table
CREATE POLICY "Users can view work order photos"
ON public.work_order_photos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert work order photos"
ON public.work_order_photos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update work order photos"
ON public.work_order_photos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete work order photos"
ON public.work_order_photos
FOR DELETE
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX idx_work_order_photos_work_order_id ON public.work_order_photos(work_order_id);
CREATE INDEX idx_work_order_photos_uploaded_at ON public.work_order_photos(uploaded_at DESC);