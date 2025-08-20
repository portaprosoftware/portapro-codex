-- Add manufacturer field to products table
ALTER TABLE public.products 
ADD COLUMN manufacturer text;