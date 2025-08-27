-- Update get_product_availability_enhanced to support day-by-day availability tracking
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
  product_record RECORD;
  daily_breakdown jsonb := '[]'::jsonb;
  loop_date date;
  day_availability jsonb;
  total_available_bulk integer := 0;
  total_tracked_available integer := 0;
  individual_items jsonb := '[]'::jsonb;
  result jsonb;
BEGIN
  -- Get product information
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_type_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Calculate bulk availability (total stock minus individually tracked items)
  SELECT 
    COUNT(*) FILTER (WHERE status = 'available') as tracked_available
  INTO total_tracked_available
  FROM public.product_items 
  WHERE product_id = product_type_id;
  
  total_available_bulk := GREATEST(0, product_record.stock_total - COALESCE((
    SELECT COUNT(*) FROM public.product_items WHERE product_id = product_type_id
  ), 0));

  -- Get all individual items with their attributes for filtering
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_id', pi.id,
      'item_code', pi.item_code,
      'status', pi.status,
      'is_available', CASE WHEN pi.status = 'available' THEN true ELSE false END,
      'attributes', jsonb_build_object(
        'color', pi.color,
        'size', pi.size,
        'material', pi.material,
        'winterized', pi.winterized
      )
    )
  ) INTO individual_items
  FROM public.product_items pi
  WHERE pi.product_id = product_type_id
    AND (filter_attributes IS NULL OR (
      (filter_attributes->>'color' IS NULL OR pi.color = (filter_attributes->>'color')) AND
      (filter_attributes->>'size' IS NULL OR pi.size = (filter_attributes->>'size')) AND
      (filter_attributes->>'material' IS NULL OR pi.material = (filter_attributes->>'material')) AND
      (filter_attributes->>'winterized' IS NULL OR pi.winterized = (filter_attributes->>'winterized')::boolean)
    ));

  -- Build day-by-day availability breakdown
  loop_date := start_date;
  WHILE loop_date <= end_date LOOP
    -- Count assignments for this specific date
    WITH daily_assignments AS (
      SELECT 
        ea.id as assignment_id,
        ea.quantity,
        ea.product_item_id,
        j.job_number,
        c.name as customer_name,
        ea.status as assignment_status
      FROM public.equipment_assignments ea
      LEFT JOIN public.jobs j ON j.id = ea.job_id
      LEFT JOIN public.customers c ON c.id = j.customer_id
      WHERE ea.product_id = product_type_id
        AND ea.status IN ('assigned', 'delivered', 'in_service')
        AND ea.assigned_date <= loop_date
        AND (ea.return_date IS NULL OR ea.return_date >= loop_date)
    ),
    bulk_assigned_count AS (
      SELECT COALESCE(SUM(da.quantity), 0) as bulk_assigned
      FROM daily_assignments da
      WHERE da.product_item_id IS NULL
    ),
    tracked_assigned_count AS (
      SELECT COUNT(*) as tracked_assigned
      FROM daily_assignments da
      WHERE da.product_item_id IS NOT NULL
    ),
    daily_conflicts AS (
      SELECT jsonb_agg(
        jsonb_build_object(
          'assignment_id', da.assignment_id,
          'job_number', da.job_number,
          'customer_name', da.customer_name,
          'item_id', da.product_item_id,
          'status', da.assignment_status
        )
      ) as conflicts
      FROM daily_assignments da
    )
    SELECT jsonb_build_object(
      'date', loop_date,
      'bulk_available', GREATEST(0, total_available_bulk - bac.bulk_assigned),
      'bulk_assigned', bac.bulk_assigned,
      'tracked_available', GREATEST(0, total_tracked_available - tac.tracked_assigned),
      'tracked_assigned', tac.tracked_assigned,
      'total_available', GREATEST(0, total_available_bulk - bac.bulk_assigned) + 
                        GREATEST(0, total_tracked_available - tac.tracked_assigned),
      'conflicts', COALESCE(dc.conflicts, '[]'::jsonb)
    ) INTO day_availability
    FROM bulk_assigned_count bac
    CROSS JOIN tracked_assigned_count tac
    CROSS JOIN daily_conflicts dc;
    
    daily_breakdown := daily_breakdown || day_availability;
    loop_date := loop_date + 1;
  END LOOP;

  -- Calculate summary for the entire period
  WITH period_summary AS (
    SELECT 
      MIN((day->>'total_available')::integer) as min_available,
      MAX((day->>'total_available')::integer) as max_available,
      AVG((day->>'total_available')::numeric) as avg_available
    FROM jsonb_array_elements(daily_breakdown) as day
  )
  SELECT jsonb_build_object(
    'available', ps.min_available, -- Conservative estimate (worst day)
    'total', product_record.stock_total,
    'method', CASE 
      WHEN total_tracked_available > 0 AND total_available_bulk > 0 THEN 'hybrid'
      WHEN total_tracked_available > 0 THEN 'individual'
      ELSE 'bulk'
    END,
    'individual_items', COALESCE(individual_items, '[]'::jsonb),
    'daily_breakdown', daily_breakdown,
    'summary', jsonb_build_object(
      'min_available', ps.min_available,
      'max_available', ps.max_available,
      'avg_available', ROUND(ps.avg_available, 1),
      'bulk_pool', total_available_bulk,
      'tracked_units', total_tracked_available
    )
  ) INTO result
  FROM period_summary ps;

  RETURN result;
END;
$$;