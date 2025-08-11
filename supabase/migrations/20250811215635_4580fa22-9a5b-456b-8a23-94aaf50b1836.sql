-- Add low_stock_threshold column to consumable_location_stock table
ALTER TABLE public.consumable_location_stock 
ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.consumable_location_stock.low_stock_threshold IS 'Threshold below which stock is considered low for this location';