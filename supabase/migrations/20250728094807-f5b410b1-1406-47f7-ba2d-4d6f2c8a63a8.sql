-- Fix the database trigger to properly calculate on_hand_qty from location_stock
-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS update_consumable_total_trigger ON public.consumables;
DROP FUNCTION IF EXISTS public.update_consumable_total_from_locations();

-- Create the corrected function to calculate on_hand_qty from location_stock JSONB
CREATE OR REPLACE FUNCTION public.update_consumable_total_from_locations()
RETURNS TRIGGER AS $$
DECLARE
  total_qty INTEGER := 0;
  location_item JSONB;
BEGIN
  -- Initialize total
  total_qty := 0;
  
  -- If location_stock is not null and is an array, sum up the quantities
  IF NEW.location_stock IS NOT NULL AND jsonb_typeof(NEW.location_stock) = 'array' THEN
    FOR location_item IN SELECT * FROM jsonb_array_elements(NEW.location_stock)
    LOOP
      -- Add the quantity from each location, defaulting to 0 if quantity is null
      total_qty := total_qty + COALESCE((location_item->>'quantity')::INTEGER, 0);
    END LOOP;
  END IF;
  
  -- Set the calculated total
  NEW.on_hand_qty := total_qty;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_consumable_total_trigger
  BEFORE INSERT OR UPDATE ON public.consumables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consumable_total_from_locations();

-- Force update all existing consumables to recalculate their totals
UPDATE public.consumables 
SET updated_at = now() 
WHERE id IN (
  SELECT id FROM public.consumables 
  WHERE location_stock IS NOT NULL 
  AND jsonb_typeof(location_stock) = 'array'
  AND jsonb_array_length(location_stock) > 0
);