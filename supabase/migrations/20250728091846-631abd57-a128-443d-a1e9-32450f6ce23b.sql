-- Simplified consumables data model with location stock as JSONB
-- This will eliminate the complex many-to-many relationship and race conditions

-- First, let's add a new column to store location stock directly in the consumables table
ALTER TABLE public.consumables 
ADD COLUMN location_stock JSONB DEFAULT '[]'::jsonb;

-- Create an index on the location_stock column for better performance
CREATE INDEX idx_consumables_location_stock ON public.consumables USING gin(location_stock);

-- Create a function to update total on_hand_qty from location_stock automatically
CREATE OR REPLACE FUNCTION update_consumable_total_from_locations()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total from location_stock jsonb array
  NEW.on_hand_qty := COALESCE(
    (SELECT SUM((value->>'quantity')::integer) 
     FROM jsonb_array_elements(NEW.location_stock) 
     WHERE (value->>'quantity')::integer > 0), 
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update on_hand_qty when location_stock changes
CREATE TRIGGER trigger_update_consumable_total
  BEFORE INSERT OR UPDATE OF location_stock ON public.consumables
  FOR EACH ROW
  EXECUTE FUNCTION update_consumable_total_from_locations();