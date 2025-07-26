-- Phase 7: Data Migration for Multi-Site Consumables
-- Migrate existing consumable stock to location-based model

-- Step 1: Create a migration function to backfill location stock
CREATE OR REPLACE FUNCTION migrate_consumable_stock_to_locations()
RETURNS TABLE(migrated_consumables integer, total_stock_migrated integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  consumable_record RECORD;
  default_location_id UUID;
  migrated_count INTEGER := 0;
  total_stock INTEGER := 0;
BEGIN
  -- Get the first active storage location as default
  SELECT id INTO default_location_id 
  FROM public.storage_locations 
  WHERE is_active = true 
  ORDER BY is_default DESC, created_at ASC 
  LIMIT 1;
  
  -- If no storage location exists, create a default one
  IF default_location_id IS NULL THEN
    INSERT INTO public.storage_locations (
      name, 
      description, 
      address_type, 
      is_default, 
      is_active
    ) VALUES (
      'Main Warehouse', 
      'Default storage location created during consumables migration', 
      'custom', 
      true, 
      true
    ) RETURNING id INTO default_location_id;
  END IF;
  
  -- Migrate each consumable's stock to the default location
  FOR consumable_record IN 
    SELECT id, on_hand_qty, name 
    FROM public.consumables 
    WHERE on_hand_qty > 0
    AND id NOT IN (
      SELECT DISTINCT consumable_id 
      FROM public.consumable_location_stock
    )
  LOOP
    -- Insert location stock record
    INSERT INTO public.consumable_location_stock (
      consumable_id,
      storage_location_id,
      quantity
    ) VALUES (
      consumable_record.id,
      default_location_id,
      consumable_record.on_hand_qty
    ) ON CONFLICT (consumable_id, storage_location_id) DO UPDATE SET
      quantity = EXCLUDED.quantity;
    
    migrated_count := migrated_count + 1;
    total_stock := total_stock + consumable_record.on_hand_qty;
    
    RAISE LOG 'Migrated consumable %: % units to default location', 
      consumable_record.name, consumable_record.on_hand_qty;
  END LOOP;
  
  RETURN QUERY SELECT migrated_count, total_stock;
END;
$$;

-- Step 2: Create helper function to sync total stock from locations
CREATE OR REPLACE FUNCTION sync_consumable_total_from_locations(consumable_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_stock INTEGER := 0;
BEGIN
  -- Calculate total stock across all locations
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_stock
  FROM public.consumable_location_stock
  WHERE consumable_id = consumable_uuid;
  
  -- Update the main consumable record
  UPDATE public.consumables
  SET on_hand_qty = total_stock,
      updated_at = now()
  WHERE id = consumable_uuid;
END;
$$;

-- Step 3: Create trigger to auto-sync totals when location stock changes
CREATE OR REPLACE FUNCTION sync_consumable_totals_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sync total for the affected consumable
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_consumable_total_from_locations(OLD.consumable_id);
    RETURN OLD;
  ELSE
    PERFORM sync_consumable_total_from_locations(NEW.consumable_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_sync_consumable_totals ON public.consumable_location_stock;
CREATE TRIGGER trigger_sync_consumable_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.consumable_location_stock
  FOR EACH ROW EXECUTE FUNCTION sync_consumable_totals_trigger();

-- Step 4: Add index for better performance on location stock queries
CREATE INDEX IF NOT EXISTS idx_consumable_location_stock_consumable_id 
  ON public.consumable_location_stock(consumable_id);
  
CREATE INDEX IF NOT EXISTS idx_consumable_location_stock_location_id 
  ON public.consumable_location_stock(storage_location_id);

-- Step 5: Add function to get consumables with location stock data
CREATE OR REPLACE FUNCTION get_consumables_with_location_stock()
RETURNS TABLE(
  id UUID,
  name TEXT,
  category TEXT,
  sku TEXT,
  unit_cost NUMERIC,
  unit_price NUMERIC,
  on_hand_qty INTEGER,
  reorder_threshold INTEGER,
  is_active BOOLEAN,
  location_stock JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.category,
    c.sku,
    c.unit_cost,
    c.unit_price,
    c.on_hand_qty,
    c.reorder_threshold,
    c.is_active,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'locationId', cls.storage_location_id,
          'locationName', sl.name,
          'onHand', cls.quantity
        )
      ) FILTER (WHERE cls.storage_location_id IS NOT NULL),
      '[]'::jsonb
    ) as location_stock
  FROM public.consumables c
  LEFT JOIN public.consumable_location_stock cls ON c.id = cls.consumable_id
  LEFT JOIN public.storage_locations sl ON cls.storage_location_id = sl.id
  WHERE c.is_active = true
  GROUP BY c.id, c.name, c.category, c.sku, c.unit_cost, c.unit_price, 
           c.on_hand_qty, c.reorder_threshold, c.is_active
  ORDER BY c.name;
END;
$$;