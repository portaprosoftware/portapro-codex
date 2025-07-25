-- Phase 7: Data Migration & Rollout Functions

-- Create function to migrate existing consumable stock to location-specific storage
CREATE OR REPLACE FUNCTION public.migrate_consumables_to_default_location()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  default_location_id UUID;
  consumable_record RECORD;
  migrated_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Get or create default storage location
  SELECT id INTO default_location_id
  FROM public.storage_locations
  WHERE is_default = true AND is_active = true
  LIMIT 1;
  
  -- If no default location exists, create one
  IF default_location_id IS NULL THEN
    INSERT INTO public.storage_locations (
      name,
      description,
      address_type,
      is_default,
      is_active
    ) VALUES (
      'Main Warehouse',
      'Auto-created default storage location for migration',
      'company_address',
      true,
      true
    ) RETURNING id INTO default_location_id;
  END IF;
  
  -- Migrate existing consumables that don't have location stock entries
  FOR consumable_record IN 
    SELECT c.id, c.on_hand_qty, c.name
    FROM public.consumables c
    WHERE c.on_hand_qty > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.consumable_location_stock cls
        WHERE cls.consumable_id = c.id
      )
  LOOP
    -- Create location stock entry for this consumable
    INSERT INTO public.consumable_location_stock (
      consumable_id,
      storage_location_id,
      quantity
    ) VALUES (
      consumable_record.id,
      default_location_id,
      consumable_record.on_hand_qty
    );
    
    -- Update consumable to reference default location
    UPDATE public.consumables 
    SET default_storage_location_id = default_location_id
    WHERE id = consumable_record.id
      AND default_storage_location_id IS NULL;
    
    migrated_count := migrated_count + 1;
    
    RAISE LOG 'Migrated consumable % with % units to default location', 
      consumable_record.name, consumable_record.on_hand_qty;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_consumables', migrated_count,
    'default_location_id', default_location_id,
    'message', format('Successfully migrated %s consumables to location-based storage', migrated_count)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'migrated_count', migrated_count
  );
END;
$function$;

-- Create function to validate storage location data integrity
CREATE OR REPLACE FUNCTION public.validate_storage_location_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  issues jsonb := '[]'::jsonb;
  consumable_record RECORD;
  location_record RECORD;
  total_location_stock INTEGER;
  master_stock INTEGER;
  issue_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Check for consumables with location stock that doesn't match master stock
  FOR consumable_record IN 
    SELECT 
      c.id,
      c.name,
      c.on_hand_qty,
      COALESCE(SUM(cls.quantity), 0) as total_location_qty
    FROM public.consumables c
    LEFT JOIN public.consumable_location_stock cls ON cls.consumable_id = c.id
    GROUP BY c.id, c.name, c.on_hand_qty
    HAVING c.on_hand_qty != COALESCE(SUM(cls.quantity), 0)
  LOOP
    issues := issues || jsonb_build_object(
      'type', 'stock_mismatch',
      'consumable_id', consumable_record.id,
      'consumable_name', consumable_record.name,
      'master_stock', consumable_record.on_hand_qty,
      'location_total', consumable_record.total_location_qty,
      'difference', consumable_record.on_hand_qty - consumable_record.total_location_qty
    );
    issue_count := issue_count + 1;
  END LOOP;
  
  -- Check for storage locations without active status
  FOR location_record IN 
    SELECT sl.id, sl.name, sl.is_active, COUNT(cls.id) as consumable_count
    FROM public.storage_locations sl
    LEFT JOIN public.consumable_location_stock cls ON cls.storage_location_id = sl.id
    WHERE sl.is_active = false AND cls.id IS NOT NULL
    GROUP BY sl.id, sl.name, sl.is_active
  LOOP
    issues := issues || jsonb_build_object(
      'type', 'inactive_location_with_stock',
      'location_id', location_record.id,
      'location_name', location_record.name,
      'consumable_count', location_record.consumable_count
    );
    issue_count := issue_count + 1;
  END LOOP;
  
  -- Check for consumables without default storage location
  FOR consumable_record IN 
    SELECT c.id, c.name
    FROM public.consumables c
    WHERE c.default_storage_location_id IS NULL
      AND c.is_active = true
  LOOP
    issues := issues || jsonb_build_object(
      'type', 'missing_default_location',
      'consumable_id', consumable_record.id,
      'consumable_name', consumable_record.name
    );
    issue_count := issue_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_issues', issue_count,
    'issues', issues,
    'validation_complete', true
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'issues_found', issue_count
  );
END;
$function$;

-- Create function to auto-fix common storage location issues
CREATE OR REPLACE FUNCTION public.auto_fix_storage_location_issues()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  default_location_id UUID;
  consumable_record RECORD;
  fixes_applied INTEGER := 0;
  result jsonb;
BEGIN
  -- Get default storage location
  SELECT id INTO default_location_id
  FROM public.storage_locations
  WHERE is_default = true AND is_active = true
  LIMIT 1;
  
  -- Fix consumables without default storage location
  FOR consumable_record IN 
    SELECT c.id, c.name
    FROM public.consumables c
    WHERE c.default_storage_location_id IS NULL
      AND c.is_active = true
  LOOP
    UPDATE public.consumables 
    SET default_storage_location_id = default_location_id
    WHERE id = consumable_record.id;
    
    fixes_applied := fixes_applied + 1;
    
    RAISE LOG 'Fixed missing default location for consumable: %', consumable_record.name;
  END LOOP;
  
  -- Sync master stock with location totals where there are discrepancies
  FOR consumable_record IN 
    SELECT 
      c.id,
      c.name,
      c.on_hand_qty,
      COALESCE(SUM(cls.quantity), 0) as total_location_qty
    FROM public.consumables c
    LEFT JOIN public.consumable_location_stock cls ON cls.consumable_id = c.id
    GROUP BY c.id, c.name, c.on_hand_qty
    HAVING c.on_hand_qty != COALESCE(SUM(cls.quantity), 0)
      AND COALESCE(SUM(cls.quantity), 0) > 0
  LOOP
    -- Update master stock to match location totals
    UPDATE public.consumables 
    SET on_hand_qty = consumable_record.total_location_qty
    WHERE id = consumable_record.id;
    
    fixes_applied := fixes_applied + 1;
    
    RAISE LOG 'Synced master stock for %: % -> %', 
      consumable_record.name, 
      consumable_record.on_hand_qty, 
      consumable_record.total_location_qty;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'fixes_applied', fixes_applied,
    'message', format('Applied %s fixes to storage location data', fixes_applied)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'fixes_applied', fixes_applied
  );
END;
$function$;

-- Create function to generate storage location summary report
CREATE OR REPLACE FUNCTION public.generate_storage_location_report()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  location_stats jsonb := '[]'::jsonb;
  location_record RECORD;
  total_locations INTEGER;
  total_consumables INTEGER;
  total_stock_value NUMERIC := 0;
  result jsonb;
BEGIN
  -- Get overall statistics
  SELECT COUNT(*) INTO total_locations 
  FROM public.storage_locations 
  WHERE is_active = true;
  
  SELECT COUNT(*) INTO total_consumables 
  FROM public.consumables 
  WHERE is_active = true;
  
  -- Get detailed stats for each location
  FOR location_record IN 
    SELECT 
      sl.id,
      sl.name,
      sl.description,
      sl.is_default,
      COUNT(cls.id) as consumable_count,
      COALESCE(SUM(cls.quantity), 0) as total_units,
      COALESCE(SUM(cls.quantity * c.unit_cost), 0) as total_value
    FROM public.storage_locations sl
    LEFT JOIN public.consumable_location_stock cls ON cls.storage_location_id = sl.id
    LEFT JOIN public.consumables c ON c.id = cls.consumable_id
    WHERE sl.is_active = true
    GROUP BY sl.id, sl.name, sl.description, sl.is_default
    ORDER BY sl.is_default DESC, sl.name
  LOOP
    location_stats := location_stats || jsonb_build_object(
      'location_id', location_record.id,
      'location_name', location_record.name,
      'description', location_record.description,
      'is_default', location_record.is_default,
      'consumable_types', location_record.consumable_count,
      'total_units', location_record.total_units,
      'total_value', location_record.total_value
    );
    
    total_stock_value := total_stock_value + location_record.total_value;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'report_date', now(),
    'summary', jsonb_build_object(
      'total_locations', total_locations,
      'total_consumable_types', total_consumables,
      'total_stock_value', total_stock_value
    ),
    'location_details', location_stats
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;