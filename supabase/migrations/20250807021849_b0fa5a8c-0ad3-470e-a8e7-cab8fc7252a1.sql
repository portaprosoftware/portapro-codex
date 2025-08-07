-- Add default item code category to products table
ALTER TABLE public.products 
ADD COLUMN default_item_code_category text;