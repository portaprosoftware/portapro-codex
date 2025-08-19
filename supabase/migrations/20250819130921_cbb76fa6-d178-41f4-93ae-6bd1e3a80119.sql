-- Create table for additional unit photos
CREATE TABLE public.product_item_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_item_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by TEXT
);

-- Add foreign key constraint
ALTER TABLE public.product_item_photos 
ADD CONSTRAINT fk_product_item_photos_item 
FOREIGN KEY (product_item_id) REFERENCES public.product_items(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_product_item_photos_item_id ON public.product_item_photos(product_item_id);
CREATE INDEX idx_product_item_photos_display_order ON public.product_item_photos(product_item_id, display_order);

-- Create trigger for updating timestamps
CREATE TRIGGER update_product_item_photos_updated_at
  BEFORE UPDATE ON public.product_item_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for unit photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('unit-photos', 'unit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for unit photos
ALTER TABLE public.product_item_photos ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (since we're not using RLS per instructions)
CREATE POLICY "Allow all operations on product_item_photos" ON public.product_item_photos
FOR ALL USING (true) WITH CHECK (true);

-- Storage policies for unit photos bucket
CREATE POLICY "Allow public read access to unit photos" ON storage.objects
FOR SELECT USING (bucket_id = 'unit-photos');

CREATE POLICY "Allow authenticated users to upload unit photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'unit-photos');

CREATE POLICY "Allow authenticated users to update unit photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'unit-photos');

CREATE POLICY "Allow authenticated users to delete unit photos" ON storage.objects
FOR DELETE USING (bucket_id = 'unit-photos');