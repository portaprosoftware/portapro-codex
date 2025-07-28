-- Fix the trigger issue and recalculate all consumables
-- First check if the trigger is properly working
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Force update all consumables to trigger the function
  FOR rec IN SELECT id FROM public.consumables LOOP
    UPDATE public.consumables 
    SET updated_at = now() 
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Test the trigger function manually to ensure it's working
-- Update a specific consumable to verify the trigger
UPDATE public.consumables 
SET location_stock = location_stock 
WHERE location_stock IS NOT NULL 
  AND location_stock != 'null'::jsonb 
  AND location_stock != '[]'::jsonb;