-- Fix the trigger function and ensure it works properly with JSONB data
-- Drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_consumable_total ON public.consumables;
DROP FUNCTION IF EXISTS update_consumable_total_from_locations();

-- Create a robust function to calculate total from location_stock JSONB
CREATE OR REPLACE FUNCTION update_consumable_total_from_locations()
RETURNS TRIGGER AS $$
DECLARE
  total_qty INTEGER := 0;
  location_item JSONB;
BEGIN
  -- Initialize total quantity
  total_qty := 0;
  
  -- Handle NULL or empty location_stock
  IF NEW.location_stock IS NULL THEN
    NEW.location_stock := '[]'::jsonb;
  END IF;
  
  -- Calculate total from location_stock JSONB array
  -- Handle both string and direct JSONB input
  IF jsonb_typeof(NEW.location_stock) = 'array' THEN
    FOR location_item IN SELECT * FROM jsonb_array_elements(NEW.location_stock)
    LOOP
      -- Extract quantity, handling both string and number types
      total_qty := total_qty + COALESCE(
        CASE 
          WHEN jsonb_typeof(location_item->'quantity') = 'string' THEN 
            (location_item->>'quantity')::integer
          WHEN jsonb_typeof(location_item->'quantity') = 'number' THEN
            (location_item->'quantity')::integer
          ELSE 0
        END, 
        0
      );
    END LOOP;
  END IF;
  
  -- Set the calculated total
  NEW.on_hand_qty := total_qty;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to automatically update on_hand_qty
CREATE TRIGGER trigger_update_consumable_total
  BEFORE INSERT OR UPDATE OF location_stock ON public.consumables
  FOR EACH ROW
  EXECUTE FUNCTION update_consumable_total_from_locations();

-- Migrate existing consumables to use the new location_stock format
-- Update all existing consumables that don't have location_stock data
UPDATE public.consumables 
SET location_stock = '[]'::jsonb 
WHERE location_stock IS NULL OR location_stock = 'null'::jsonb;

-- For any consumables that have on_hand_qty but no location_stock, 
-- create a default location entry (if default storage location exists)
UPDATE public.consumables 
SET location_stock = jsonb_build_array(
  jsonb_build_object(
    'locationId', COALESCE(default_storage_location_id::text, 'default'),
    'locationName', 'Default Location',
    'quantity', on_hand_qty
  )
)
WHERE jsonb_array_length(location_stock) = 0 
  AND on_hand_qty > 0;