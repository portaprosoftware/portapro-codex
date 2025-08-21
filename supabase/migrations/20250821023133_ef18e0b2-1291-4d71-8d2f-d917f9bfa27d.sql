-- Update get_product_availability_enhanced to return ALL individual items regardless of status
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
  reserved_count INTEGER := 0;
  available_stock INTEGER := 0;
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
      'specific_assigned', 0
    );
  END IF;

  -- Calculate total reserved count (bulk and specific)
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN ea.product_id IS NOT NULL THEN ea.quantity
        ELSE 1 
      END
    ), 0
  ) INTO reserved_count
  FROM public.equipment_assignments ea
  WHERE (
    ea.product_id = product_type_id OR
    ea.product_item_id IN (
      SELECT id FROM public.product_items WHERE product_id = product_type_id
    )
  )
  AND ea.status IN ('assigned', 'delivered', 'in_service')
  AND ea.assigned_date <= end_date
  AND (ea.return_date IS NULL OR ea.return_date >= start_date);

  -- Calculate available stock from master stock (only count available items)
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
    );

  -- Return ALL individual items regardless of status, optionally filtered by attributes
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

  -- If filtering, cap availability to the number of matching available individual items
  IF filter_attributes IS NOT NULL AND filter_attributes != '{}'::jsonb THEN
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
      'bulk_assigned', 0,
      'specific_assigned', 0
    );
  END IF;

  -- No filtering - return all individual items with their availability status
  RETURN jsonb_build_object(
    'available', available_stock,
    'total', product_record.stock_total,
    'method', 'stock_total',
    'individual_items', COALESCE(items, '[]'::jsonb),
    'bulk_assigned', 0,
    'specific_assigned', 0
  );
END;
$function$;