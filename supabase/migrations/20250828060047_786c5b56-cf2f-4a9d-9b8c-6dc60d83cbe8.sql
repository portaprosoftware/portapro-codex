CREATE OR REPLACE FUNCTION public.get_product_availability_enhanced(
  product_type_id uuid,
  start_date date,
  end_date date,
  filter_attributes jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result jsonb;
  daily_data jsonb[] := '{}';
  summary_data jsonb;
  individual_items jsonb[] := '{}';
  date_iter date;
  day_available integer;
  day_assigned integer;
  conflicts jsonb[] := '{}';
  total_tracked_units integer := 0;
BEGIN
  -- Get total tracked units for this product
  SELECT COUNT(*)
  INTO total_tracked_units
  FROM public.product_items
  WHERE product_id = product_type_id;
  
  -- Get individual items (tracked units only), attributes omitted to avoid schema dependency
  SELECT array_agg(
    jsonb_build_object(
      'item_id', pi.id,
      'item_code', pi.item_code,
      'status', pi.status,
      'is_available', (pi.status = 'available'),
      'attributes', jsonb_build_object() -- empty object, frontend field is optional
    )
  )
  INTO individual_items
  FROM public.product_items pi
  WHERE pi.product_id = product_type_id;
  
  -- Generate daily breakdown for date range
  date_iter := start_date;
  WHILE date_iter <= end_date LOOP
    -- Count available tracked units for this date
    SELECT COUNT(*)
    INTO day_available
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
    AND pi.status = 'available'
    AND pi.id NOT IN (
      SELECT ea.product_item_id
      FROM public.equipment_assignments ea
      WHERE ea.product_item_id IS NOT NULL
      AND ea.status IN ('assigned', 'delivered', 'in_service')
      AND ea.assigned_date <= date_iter
      AND (ea.return_date IS NULL OR ea.return_date >= date_iter)
    );
    
    -- Count assigned tracked units for this date
    day_assigned := total_tracked_units - day_available;
    
    -- Get conflicts (active assignments) for this date - now including item_code
    SELECT array_agg(
      jsonb_build_object(
        'assignment_id', ea.id,
        'job_number', j.job_number,
        'customer_name', c.name,
        'item_id', ea.product_item_id,
        'item_code', pi.item_code,
        'status', ea.status
      )
    )
    INTO conflicts
    FROM public.equipment_assignments ea
    LEFT JOIN public.jobs j ON j.id = ea.job_id
    LEFT JOIN public.customers c ON c.id = j.customer_id
    LEFT JOIN public.product_items pi ON pi.id = ea.product_item_id
    WHERE ea.product_item_id IN (
      SELECT pi2.id 
      FROM public.product_items pi2 
      WHERE pi2.product_id = product_type_id
    )
    AND ea.status IN ('assigned', 'delivered', 'in_service')
    AND ea.assigned_date <= date_iter
    AND (ea.return_date IS NULL OR ea.return_date >= date_iter);
    
    -- Add to daily data
    daily_data := daily_data || jsonb_build_object(
      'date', date_iter,
      'bulk_available', 0,  -- Always 0 now
      'bulk_assigned', 0,   -- Always 0 now
      'tracked_available', day_available,
      'tracked_assigned', day_assigned,
      'total_available', day_available,  -- Only tracked units count
      'conflicts', COALESCE(conflicts, '{}')
    );
    
    date_iter := date_iter + 1;
  END LOOP;
  
  -- Calculate summary (only tracked units)
  SELECT jsonb_build_object(
    'min_available', COALESCE(MIN((daily_item->>'total_available')::integer), 0),
    'max_available', COALESCE(MAX((daily_item->>'total_available')::integer), 0),
    'avg_available', COALESCE(AVG((daily_item->>'total_available')::integer), 0),
    'bulk_pool', 0,  -- Always 0 now
    'tracked_units', total_tracked_units
  )
  INTO summary_data
  FROM unnest(daily_data) as daily_item;
  
  -- Build final result
  result := jsonb_build_object(
    'available', COALESCE(MIN((daily_item->>'total_available')::integer), 0),
    'total', total_tracked_units,
    'method', 'tracked_only',
    'individual_items', COALESCE(individual_items, '{}'),
    'daily_breakdown', daily_data,
    'summary', summary_data
  )
  FROM unnest(daily_data) as daily_item;
  
  RETURN result;
END;
$function$