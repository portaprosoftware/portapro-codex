-- Remove the reorder_threshold column from consumable_location_stock table
-- This simplifies the logic by only having a global reorder threshold on the main consumables table

ALTER TABLE public.consumable_location_stock 
DROP COLUMN IF EXISTS reorder_threshold;