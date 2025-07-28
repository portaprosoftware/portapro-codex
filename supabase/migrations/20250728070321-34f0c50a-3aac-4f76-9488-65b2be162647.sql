-- Add reorder_threshold column to consumable_location_stock table
ALTER TABLE public.consumable_location_stock 
ADD COLUMN reorder_threshold integer DEFAULT 0;