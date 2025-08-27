-- Fix get_product_availability_enhanced function to include customer information and fix counting
CREATE OR REPLACE FUNCTION public.get_product_availability_enhanced(
  product_type_id uuid,
  start_date date,
  end_date date,
  filter_attributes jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  product_record RECORD;
  individual_count INTEGER := 0;
  available_individual INTEGER := 0;
  bulk_pool INTEGER := 0;
  total_available INTEGER := 0;
  daily_data jsonb[] := '{}';
  conflicts_data jsonb[] := '{}';
  current_date_iter date := start_date;
  summary_data jsonb;
BEGIN
  -- Get product information
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_type_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'available', 0,
      'total', 0,
      'method', 'product_not_found',
      'individual_items', '[]'::jsonb,
      'daily_breakdown', '[]'::jsonb,
      'summary', jsonb_build_object(
        'min_available', 0,
        'max_available', 0,
        'avg_available', 0,
        'bulk_pool', 0,
        'tracked_units', 0
      )
    );
  END IF;

  -- Count individual items with filter support
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available
  INTO individual_count, available_individual
  FROM public.product_items pi
  WHERE pi.product_id = product_type_id
    AND (filter_attributes IS NULL OR 
         (pi.attributes @> filter_attributes OR jsonb_typeof(filter_attributes) = 'null'));

  -- Calculate bulk pool (remaining after tracked items)
  bulk_pool := GREATEST(0, product_record.stock_total - individual_count);
  
  -- Build daily breakdown
  WHILE current_date_iter <= end_date LOOP
    DECLARE
      daily_available INTEGER := 0;
      daily_assigned INTEGER := 0;
      daily_conflicts jsonb[] := '{}';
      daily_bulk_available INTEGER := bulk_pool;
      daily_bulk_assigned INTEGER := 0;
    BEGIN
      -- Count assigned individual items for this date
      SELECT 
        COUNT(*) FILTER (WHERE pi.status = 'available'),
        COUNT(*) FILTER (WHERE pi.status != 'available')
      INTO daily_available, daily_assigned
      FROM public.product_items pi
      WHERE pi.product_id = product_type_id
        AND (filter_attributes IS NULL OR 
             (pi.attributes @> filter_attributes OR jsonb_typeof(filter_attributes) = 'null'))
        AND pi.id IN (
          SELECT ea.product_item_id
          FROM public.equipment_assignments ea
          JOIN public.jobs j ON j.id = ea.job_id
          WHERE ea.product_item_id IS NOT NULL
            AND ea.status IN ('assigned', 'delivered', 'in_service')
            AND ea.assigned_date <= current_date_iter
            AND (ea.return_date IS NULL OR ea.return_date >= current_date_iter)
        );

      -- Count bulk assignments for this date
      SELECT COALESCE(SUM(ea.quantity), 0)
      INTO daily_bulk_assigned
      FROM public.equipment_assignments ea
      JOIN public.jobs j ON j.id = ea.job_id
      WHERE ea.product_id = product_type_id
        AND ea.product_item_id IS NULL
        AND ea.status IN ('assigned', 'delivered', 'in_service')
        AND ea.assigned_date <= current_date_iter
        AND (ea.return_date IS NULL OR ea.return_date >= current_date_iter);

      -- Get conflicts with customer information
      SELECT array_agg(
        jsonb_build_object(
          'assignment_id', ea.id::text,
          'job_number', j.job_number,
          'customer_name', c.name,
          'item_id', COALESCE(ea.product_item_id::text, ''),
          'status', ea.status
        )
      ) INTO daily_conflicts
      FROM public.equipment_assignments ea
      JOIN public.jobs j ON j.id = ea.job_id
      JOIN public.customers c ON c.id = j.customer_id
      WHERE (ea.product_id = product_type_id OR ea.product_item_id IN (
        SELECT pi.id FROM public.product_items pi WHERE pi.product_id = product_type_id
      ))
        AND ea.status IN ('assigned', 'delivered', 'in_service')
        AND ea.assigned_date <= current_date_iter
        AND (ea.return_date IS NULL OR ea.return_date >= current_date_iter);

      -- Adjust bulk availability
      daily_bulk_available := GREATEST(0, bulk_pool - daily_bulk_assigned);

      -- Add to daily data
      daily_data := daily_data || jsonb_build_object(
        'date', current_date_iter,
        'bulk_available', daily_bulk_available,
        'bulk_assigned', daily_bulk_assigned,
        'tracked_available', GREATEST(0, available_individual - daily_assigned),
        'tracked_assigned', daily_assigned,
        'total_available', GREATEST(0, daily_bulk_available + available_individual - daily_assigned),
        'conflicts', COALESCE(daily_conflicts, '{}')
      );

      -- Collect all conflicts for summary
      IF daily_conflicts IS NOT NULL THEN
        conflicts_data := conflicts_data || daily_conflicts;
      END IF;

      current_date_iter := current_date_iter + 1;
    END;
  END LOOP;

  -- Calculate total available (for single date or range minimum)
  IF start_date = end_date THEN
    -- Single date calculation
    DECLARE
      assigned_individual INTEGER := 0;
      assigned_bulk INTEGER := 0;
    BEGIN
      -- Count assigned individual items
      SELECT COUNT(*)
      INTO assigned_individual
      FROM public.product_items pi
      WHERE pi.product_id = product_type_id
        AND (filter_attributes IS NULL OR 
             (pi.attributes @> filter_attributes OR jsonb_typeof(filter_attributes) = 'null'))
        AND pi.id IN (
          SELECT ea.product_item_id
          FROM public.equipment_assignments ea
          WHERE ea.product_item_id IS NOT NULL
            AND ea.status IN ('assigned', 'delivered', 'in_service')
            AND ea.assigned_date <= start_date
            AND (ea.return_date IS NULL OR ea.return_date >= start_date)
        );

      -- Count bulk assignments
      SELECT COALESCE(SUM(ea.quantity), 0)
      INTO assigned_bulk
      FROM public.equipment_assignments ea
      WHERE ea.product_id = product_type_id
        AND ea.product_item_id IS NULL
        AND ea.status IN ('assigned', 'delivered', 'in_service')
        AND ea.assigned_date <= start_date
        AND (ea.return_date IS NULL OR ea.return_date >= start_date);

      total_available := GREATEST(0, (available_individual - assigned_individual) + (bulk_pool - assigned_bulk));
    END;
  ELSE
    -- For date ranges, use minimum availability
    SELECT MIN((daily->>'total_available')::integer)
    INTO total_available
    FROM unnest(daily_data) as daily;
  END IF;

  -- Build summary
  summary_data := jsonb_build_object(
    'min_available', (SELECT MIN((daily->>'total_available')::integer) FROM unnest(daily_data) as daily),
    'max_available', (SELECT MAX((daily->>'total_available')::integer) FROM unnest(daily_data) as daily),
    'avg_available', (SELECT AVG((daily->>'total_available')::integer) FROM unnest(daily_data) as daily),
    'bulk_pool', bulk_pool,
    'tracked_units', individual_count
  );

  -- Get individual items if requested
  DECLARE
    individual_items jsonb;
  BEGIN
    SELECT jsonb_agg(
      jsonb_build_object(
        'item_id', pi.id,
        'item_code', pi.item_code,
        'status', pi.status,
        'is_available', (pi.status = 'available'),
        'attributes', pi.attributes
      )
    ) INTO individual_items
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
      AND (filter_attributes IS NULL OR 
           (pi.attributes @> filter_attributes OR jsonb_typeof(filter_attributes) = 'null'));

    RETURN jsonb_build_object(
      'available', total_available,
      'total', product_record.stock_total,
      'method', 'enhanced_calculation',
      'individual_items', COALESCE(individual_items, '[]'::jsonb),
      'daily_breakdown', array_to_json(daily_data)::jsonb,
      'summary', summary_data
    );
  END;
END;
$$;