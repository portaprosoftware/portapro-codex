-- Fix tracking method logic in get_product_availability_enhanced
CREATE OR REPLACE FUNCTION public.get_product_availability_enhanced(
  product_type_id uuid,
  start_date date,
  end_date date,
  filter_attributes jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  product_record RECORD;
  individual_count INTEGER := 0;
  available_individual INTEGER := 0;
  assigned_individual INTEGER := 0;
  maintenance_individual INTEGER := 0;
  bulk_assigned INTEGER := 0;
  available_stock INTEGER := 0;
  bulk_pool INTEGER := 0;
  items jsonb := '[]'::jsonb;
BEGIN
  -- Get product information
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_type_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'available', 0,
      'total', 0,
      'method', 'not_found',
      'individual_items', '[]'::jsonb,
      'bulk_assigned', 0,
      'specific_assigned', 0,
      'breakdown', jsonb_build_object(
        'bulk_pool', 0,
        'available_tracked', 0,
        'assigned_tracked', 0,
        'maintenance_tracked', 0,
        'bulk_assigned', 0
      )
    );
  END IF;

  -- Count individual items by status
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available,
    COUNT(*) FILTER (WHERE status IN ('assigned', 'in_service', 'delivered')) as assigned,
    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance
  INTO individual_count, available_individual, assigned_individual, maintenance_individual
  FROM public.product_items 
  WHERE product_id = product_type_id;

  -- Count bulk assignments (assignments without specific product_item_id)
  SELECT COALESCE(SUM(quantity), 0) INTO bulk_assigned
  FROM public.equipment_assignments ea
  WHERE ea.product_id = product_type_id
    AND ea.product_item_id IS NULL
    AND ea.status IN ('assigned', 'delivered', 'in_service')
    AND ea.assigned_date <= end_date
    AND (ea.return_date IS NULL OR ea.return_date >= start_date);

  -- Calculate bulk pool (master stock minus individual items minus bulk assignments)
  bulk_pool := GREATEST(0, product_record.stock_total - individual_count - bulk_assigned);
  
  -- Total available = bulk pool + available individual items
  available_stock := bulk_pool + available_individual;

  -- Get ALL individual items regardless of status (for products with individual tracking)
  IF individual_count > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'item_id', pi.id,
        'item_code', pi.item_code,
        'status', pi.status,
        'is_available', (
          pi.status = 'available' AND pi.id NOT IN (
            SELECT ea.product_item_id
            FROM public.equipment_assignments ea
            WHERE ea.product_item_id IS NOT NULL
              AND ea.status IN ('assigned', 'delivered', 'in_service')
              AND ea.assigned_date <= end_date
              AND (ea.return_date IS NULL OR ea.return_date >= start_date)
          )
        ),
        'attributes', jsonb_build_object(
          'color', pi.color,
          'size', pi.size,
          'material', pi.material,
          'winterized', pi.winterized
        )
      )
    ) INTO items
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
      AND (
        filter_attributes IS NULL OR filter_attributes = '{}'::jsonb OR (
          (filter_attributes->>'color' IS NULL OR pi.color = filter_attributes->>'color') AND
          (filter_attributes->>'size' IS NULL OR pi.size = filter_attributes->>'size') AND
          (filter_attributes->>'material' IS NULL OR pi.material = filter_attributes->>'material') AND
          (filter_attributes->>'winterized' IS NULL OR pi.winterized = (filter_attributes->>'winterized')::boolean)
        )
      );
  END IF;

  -- If filtering by attributes, only return matching available units
  IF filter_attributes IS NOT NULL AND filter_attributes != '{}'::jsonb THEN
    -- Recalculate available stock for filtered results
    SELECT COUNT(*) INTO available_stock
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
      AND pi.status = 'available'
      AND pi.id NOT IN (
        SELECT ea.product_item_id
        FROM public.equipment_assignments ea
        WHERE ea.product_item_id IS NOT NULL
          AND ea.status IN ('assigned', 'delivered', 'in_service')
          AND ea.assigned_date <= end_date
          AND (ea.return_date IS NULL OR ea.return_date >= start_date)
      )
      AND (
        (filter_attributes->>'color' IS NULL OR pi.color = filter_attributes->>'color') AND
        (filter_attributes->>'size' IS NULL OR pi.size = filter_attributes->>'size') AND
        (filter_attributes->>'material' IS NULL OR pi.material = filter_attributes->>'material') AND
        (filter_attributes->>'winterized' IS NULL OR pi.winterized = (filter_attributes->>'winterized')::boolean)
      );
      
    RETURN jsonb_build_object(
      'available', available_stock,
      'total', product_record.stock_total,
      'method', 'filtered',
      'individual_items', COALESCE(items, '[]'::jsonb),
      'bulk_assigned', bulk_assigned,
      'specific_assigned', assigned_individual,
      'breakdown', jsonb_build_object(
        'bulk_pool', 0, -- No bulk pool for filtered results
        'available_tracked', available_stock,
        'assigned_tracked', assigned_individual,
        'maintenance_tracked', maintenance_individual,
        'bulk_assigned', bulk_assigned
      )
    );
  END IF;

  -- Return complete breakdown for all products with CORRECTED tracking method logic
  RETURN jsonb_build_object(
    'available', available_stock,
    'total', product_record.stock_total,
    'method', CASE 
      WHEN individual_count > 0 AND bulk_pool > 0 THEN 'hybrid_tracking'
      WHEN individual_count > 0 AND bulk_pool = 0 THEN 'individual_tracking'
      ELSE 'bulk_only'
    END,
    'individual_items', COALESCE(items, '[]'::jsonb),
    'bulk_assigned', bulk_assigned,
    'specific_assigned', assigned_individual,
    'breakdown', jsonb_build_object(
      'bulk_pool', bulk_pool,
      'available_tracked', available_individual,
      'assigned_tracked', assigned_individual,
      'maintenance_tracked', maintenance_individual,
      'bulk_assigned', bulk_assigned
    )
  );
END;
$function$;