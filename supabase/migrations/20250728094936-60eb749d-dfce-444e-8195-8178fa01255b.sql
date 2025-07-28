-- Create a safer function that handles different data types in location_stock
DROP TRIGGER IF EXISTS update_consumable_total_trigger ON public.consumables CASCADE;
DROP FUNCTION IF EXISTS public.update_consumable_total_from_locations() CASCADE;

CREATE OR REPLACE FUNCTION public.update_consumable_total_from_locations()
RETURNS TRIGGER AS $$
DECLARE
  total_qty INTEGER := 0;
  location_item JSONB;
BEGIN
  -- Initialize total
  total_qty := 0;
  
  -- Handle different types of location_stock data
  BEGIN
    -- Check if location_stock exists and is not null
    IF NEW.location_stock IS NOT NULL THEN
      -- Try to handle it as an array
      IF jsonb_typeof(NEW.location_stock) = 'array' THEN
        -- It's already an array, process it
        FOR location_item IN SELECT * FROM jsonb_array_elements(NEW.location_stock)
        LOOP
          total_qty := total_qty + COALESCE((location_item->>'quantity')::INTEGER, 0);
        END LOOP;
      ELSE
        -- If it's not an array, try to parse it as a string that might contain JSON
        IF jsonb_typeof(NEW.location_stock) = 'string' THEN
          -- Try to parse the string as JSON array
          DECLARE
            parsed_json JSONB;
          BEGIN
            parsed_json := (NEW.location_stock #>> '{}')::JSONB;
            IF jsonb_typeof(parsed_json) = 'array' THEN
              FOR location_item IN SELECT * FROM jsonb_array_elements(parsed_json)
              LOOP
                total_qty := total_qty + COALESCE((location_item->>'quantity')::INTEGER, 0);
              END LOOP;
            END IF;
          EXCEPTION WHEN OTHERS THEN
            -- If parsing fails, set total to 0
            total_qty := 0;
          END;
        END IF;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, default to 0
    total_qty := 0;
  END;
  
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

-- Force update existing consumables with simple check
UPDATE public.consumables 
SET updated_at = now() 
WHERE location_stock IS NOT NULL;