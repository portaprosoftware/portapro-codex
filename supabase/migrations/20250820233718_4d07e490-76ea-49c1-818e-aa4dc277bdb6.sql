-- Add product type enum
CREATE TYPE product_type AS ENUM (
  'standard_toilet',
  'ada_toilet', 
  'deluxe_toilet',
  'high_rise_toilet',
  'handwashing_station_single',
  'handwashing_station_double',
  'restroom_trailer',
  'shower_trailer',
  'holding_tank',
  'urinal_stand',
  'sanitizer_stand',
  'accessories',
  'custom'
);

-- Add product_type and product_variant columns to products table
ALTER TABLE public.products 
ADD COLUMN product_type product_type DEFAULT 'standard_toilet',
ADD COLUMN product_variant text;

-- Add index for better filtering performance
CREATE INDEX idx_products_product_type ON public.products(product_type);

-- Update existing products with default product type based on name patterns
UPDATE public.products 
SET product_type = CASE 
  WHEN LOWER(name) LIKE '%ada%' OR LOWER(name) LIKE '%handicap%' THEN 'ada_toilet'
  WHEN LOWER(name) LIKE '%deluxe%' OR LOWER(name) LIKE '%flush%' THEN 'deluxe_toilet'
  WHEN LOWER(name) LIKE '%sink%' OR LOWER(name) LIKE '%wash%' THEN 'handwashing_station_single'
  WHEN LOWER(name) LIKE '%trailer%' THEN 'restroom_trailer'
  WHEN LOWER(name) LIKE '%tank%' THEN 'holding_tank'
  WHEN LOWER(name) LIKE '%urinal%' THEN 'urinal_stand'
  WHEN LOWER(name) LIKE '%sanitizer%' THEN 'sanitizer_stand'
  ELSE 'standard_toilet'
END;