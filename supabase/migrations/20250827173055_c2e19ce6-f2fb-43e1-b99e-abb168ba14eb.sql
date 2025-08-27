
-- 1) Indexes to keep the function fast
CREATE INDEX IF NOT EXISTS idx_ea_tracked_active
ON public.equipment_assignments (product_item_id, assigned_date, return_date)
WHERE product_item_id IS NOT NULL
  AND status IN ('assigned','delivered','in_service');

CREATE INDEX IF NOT EXISTS idx_ea_bulk_active
ON public.equipment_assignments (product_id, assigned_date, return_date)
WHERE product_item_id IS NULL
  AND status IN ('assigned','delivered','in_service');

CREATE INDEX IF NOT EXISTS idx_product_items_product_status
ON public.product_items (product_id, status);

CREATE INDEX IF NOT EXISTS idx_product_item_attributes_item_name_value
ON public.product_item_attributes (item_id, property_name, property_value);

-- 2) Availability function: include bulk pool and avoid double counting
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
  s_date date := start_date;
  e_date date := COALESCE(end_date, start_date);
  total_stock integer := 0;
  tracked_total integer := 0;
  bulk_pool integer := 0;

  daily_breakdown jsonb := '[]'::jsonb;
  min_avail integer := 0;
  max_avail integer := 0;
  avg_avail integer := 0;

  method text := 'stock_total';
  total_overall integer := 0;
  result jsonb;
BEGIN
  IF e_date < s_date THEN
    e_date := s_date;
  END IF;

  -- Base product
  SELECT COALESCE(p.stock_total, 0)
  INTO total_stock
  FROM public.products p
  WHERE p.id = product_type_id;

  IF total_stock IS NULL THEN
    RETURN jsonb_build_object(
      'available', 0,
      'total', 0,
      'method', 'none',
      'daily_breakdown', '[]'::jsonb,
      'individual_items', '[]'::jsonb,
      'summary', jsonb_build_object('min_available', 0, 'max_available', 0, 'avg_available', 0, 'bulk_pool', 0, 'tracked_units', 0)
    );
  END IF;

  -- Tracked items filtered by variations (if provided)
  WITH filters AS (
    SELECT key AS property_name, value::text AS property_value
    FROM jsonb_each_text(filter_attributes)
  ),
  items AS (
    SELECT pi.id
    FROM public.product_items pi
    LEFT JOIN filters f ON TRUE
    LEFT JOIN public.product_item_attributes a
      ON a.item_id = pi.id
     AND a.property_name = f.property_name
     AND a.property_value = f.property_value
    WHERE pi.product_id = product_type_id
      AND (pi.status IS NULL OR pi.status NOT IN ('retired','lost','maintenance'))
    GROUP BY pi.id
    HAVING (filter_attributes IS NULL) OR COUNT(f.property_name) = COUNT(a.property_name)
  )
  SELECT COUNT(*) INTO tracked_total FROM items;

  -- Bulk pool = stock_total - total number of tracked units (regardless of filter)
  SELECT GREATEST(total_stock - COUNT(*), 0)
  INTO bulk_pool
  FROM public.product_items pi
  WHERE pi.product_id = product_type_id;

  -- Daily breakdown including tracked and bulk, plus conflicts
  WITH day_series AS (
    SELECT generate_series(s_date, e_date, '1 day'::interval)::date AS d
  ),
  filters AS (
    SELECT key AS property_name, value::text AS property_value
    FROM jsonb_each_text(filter_attributes)
  ),
  items AS (
    SELECT pi.id
    FROM public.product_items pi
    LEFT JOIN filters f ON TRUE
    LEFT JOIN public.product_item_attributes a
      ON a.item_id = pi.id
     AND a.property_name = f.property_name
     AND a.property_value = f.property_value
    WHERE pi.product_id = product_type_id
      AND (pi.status IS NULL OR pi.status NOT IN ('retired','lost','maintenance'))
    GROUP BY pi.id
    HAVING (filter_attributes IS NULL) OR COUNT(f.property_name) = COUNT(a.property_name)
  ),
  tracked_assigned AS (
    SELECT d.d AS date, COUNT(DISTINCT ea.product_item_id) AS cnt
    FROM day_series d
    LEFT JOIN public.equipment_assignments ea
      ON ea.product_item_id IN (SELECT id FROM items)
     AND ea.status IN ('assigned','delivered','in_service')
     AND d.d BETWEEN ea.assigned_date AND COALESCE(ea.return_date, ea.assigned_date)
    GROUP BY d.d
  ),
  bulk_assigned AS (
    SELECT d.d AS date, COALESCE(SUM(ea.quantity), 0) AS qty
    FROM day_series d
    LEFT JOIN public.equipment_assignments ea
      ON ea.product_id = product_type_id
     AND ea.product_item_id IS NULL  -- bulk-only; avoids double counting tracked
     AND ea.status IN ('assigned','delivered','in_service')
     AND d.d BETWEEN ea.assigned_date AND COALESCE(ea.return_date, ea.assigned_date)
    GROUP BY d.d
  ),
  metrics AS (
    SELECT 
      d.d AS date,
      COALESCE((SELECT COUNT(*) FROM items), 0) AS tracked_total_for_filter,
      COALESCE(ta.cnt, 0) AS tracked_assigned,
      GREATEST(COALESCE((SELECT COUNT(*) FROM items), 0) - COALESCE(ta.cnt, 0), 0) AS tracked_available,
      COALESCE(ba.qty, 0) AS bulk_assigned,
      GREATEST(bulk_pool - COALESCE(ba.qty, 0), 0) AS bulk_available
    FROM day_series d
    LEFT JOIN tracked_assigned ta ON ta.date = d.d
    LEFT JOIN bulk_assigned ba ON ba.date = d.d
  ),
  conflicts AS (
    SELECT 
      d.d AS date,
      jsonb_agg(
        jsonb_build_object(
          'assignment_id', ea.id::text,
          'job_number', j.job_number,
          'customer_name', c.name,
          'item_id', ea.product_item_id::text,
          'status', ea.status
        )
      ) FILTER (WHERE ea.id IS NOT NULL) AS conflict_list
    FROM (SELECT d FROM day_series) d
    LEFT JOIN public.equipment_assignments ea
      ON ea.status IN ('assigned','delivered','in_service')
     AND (
          (ea.product_item_id IN (SELECT id FROM items)) -- tracked-with-attributes
       OR (ea.product_id = product_type_id AND ea.product_item_id IS NULL) -- bulk
     )
     AND d.d BETWEEN ea.assigned_date AND COALESCE(ea.return_date, ea.assigned_date)
    LEFT JOIN public.jobs j ON j.id = ea.job_id
    LEFT JOIN public.customers c ON c.id = j.customer_id
    GROUP BY d.d
  ),
  summarized AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'date', to_char(m.date, 'YYYY-MM-DD'),
          'bulk_available', m.bulk_available,
          'bulk_assigned', m.bulk_assigned,
          'tracked_available', m.tracked_available,
          'tracked_assigned', m.tracked_assigned,
          'total_available', m.tracked_available + m.bulk_available,
          'conflicts', COALESCE(cf.conflict_list, '[]'::jsonb)
        )
        ORDER BY m.date
      ) AS daily_json,
      MIN(m.tracked_available + m.bulk_available) AS min_avail,
      MAX(m.tracked_available + m.bulk_available) AS max_avail,
      AVG(m.tracked_available + m.bulk_available)::integer AS avg_avail
    FROM metrics m
    LEFT JOIN conflicts cf ON cf.date = m.date
  )
  SELECT daily_json, COALESCE(min_avail, 0), COALESCE(max_avail, 0), COALESCE(avg_avail, 0)
  INTO daily_breakdown, min_avail, max_avail, avg_avail
  FROM summarized;

  -- Method and totals
  IF tracked_total > 0 AND bulk_pool > 0 THEN
    method := 'hybrid_tracking';
  ELSIF tracked_total > 0 THEN
    method := 'individual_tracking';
  ELSE
    method := 'bulk_tracking';
  END IF;

  total_overall := tracked_total + bulk_pool;

  result := jsonb_build_object(
    'available', COALESCE(min_avail, 0),
    'total', total_overall,
    'method', method,
    'individual_items', '[]'::jsonb,
    'daily_breakdown', COALESCE(daily_breakdown, '[]'::jsonb),
    'summary', jsonb_build_object(
      'min_available', COALESCE(min_avail, 0),
      'max_available', COALESCE(max_avail, 0),
      'avg_available', COALESCE(avg_avail, 0),
      'bulk_pool', bulk_pool,
      'tracked_units', tracked_total
    )
  );

  RETURN result;
END;
$function$;
