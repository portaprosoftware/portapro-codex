-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product images
CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Add pricing fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS charge_for_product BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pricing_method TEXT DEFAULT 'duration_based' CHECK (pricing_method IN ('duration_based', 'fixed_price')),
ADD COLUMN IF NOT EXISTS daily_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fixed_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url TEXT;