-- Fix the trigger function to properly calculate on_hand_qty from location_stock JSONB
CREATE OR REPLACE FUNCTION public.update_consumable_total_from_locations()
RETURNS TRIGGER AS $$
DECLARE
  total_qty INTEGER := 0;
  location_item JSONB;
BEGIN
  -- Reset total
  total_qty := 0;
  
  -- Handle the case where location_stock might be null or empty
  IF NEW.location_stock IS NOT NULL AND NEW.location_stock != 'null'::jsonb AND NEW.location_stock != '[]'::jsonb THEN
    -- Loop through each location in the JSONB array
    FOR location_item IN SELECT * FROM jsonb_array_elements(NEW.location_stock)
    LOOP
      -- Add the quantity from this location (handle both 'quantity' and other possible field names)
      IF location_item ? 'quantity' THEN
        total_qty := total_qty + COALESCE((location_item->>'quantity')::INTEGER, 0);
      END IF;
    END LOOP;
  END IF;
  
  -- Update the on_hand_qty with the calculated total
  NEW.on_hand_qty := total_qty;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Force update all existing consumables to recalculate their totals
UPDATE public.consumables 
SET updated_at = now() 
WHERE location_stock IS NOT NULL 
  AND location_stock != 'null'::jsonb 
  AND location_stock != '[]'::jsonb;