
-- 1) Replace get_product_availability_enhanced with a version compatible with the current variations model
--    - Uses product_item_attributes.item_id (not product_item_id)
--    - Compares filter values against product_item_attributes.property_value
--    - Builds per-item attributes map from pp.attribute_name -> pia.property_value

CREATE OR REPLACE FUNCTION public.get_product_availability_enhanced(
  product_type_id uuid,
  start_date date,
  end_date date,
  filter_attributes jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_stock INTEGER := 0;
  tracked_total INTEGER := 0;
  bulk_pool INTEGER := 0;
  daily jsonb := '[]'::jsonb;
  min_avail INTEGER := NULL;
  max_avail INTEGER := NULL;
  avg_avail NUMERIC := 0;
  available_overall INTEGER := 0;
  method_text TEXT := 'calendar_min';
  individual_items_json jsonb := '[]'::jsonb;
  summary_json jsonb;
BEGIN
  IF start_date IS NULL THEN
    RETURN jsonb_build_object('available', 0, 'total', 0, 'method', 'none', 'individual_items', '[]'::jsonb);
  END IF;
  IF end_date IS NULL THEN end_date := start_date; END IF;

  -- Product stock
  SELECT COALESCE(p.stock_total, 0) INTO total_stock
  FROM public.products p WHERE p.id = product_type_id;

  IF total_stock IS NULL THEN
    RETURN jsonb_build_object('available', 0, 'total', 0, 'method', 'none', 'individual_items', '[]'::jsonb);
  END IF;

  -- Count tracked items matching optional variation filters
  WITH filters AS (
    SELECT key AS attribute_name,
           CASE 
             WHEN jsonb_typeof(value) = 'array' THEN ARRAY(SELECT elem->>0 FROM jsonb_array_elements(value) elem)
             ELSE ARRAY[value::text]
           END AS values
    FROM jsonb_each(COALESCE(filter_attributes, '{}'::jsonb))
  ),
  matching_items AS (
    SELECT pi.id
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
    GROUP BY pi.id
    HAVING COALESCE((
      SELECT COUNT(DISTINCT f.attribute_name)
      FROM filters f
      JOIN public.product_item_attributes pia ON pia.item_id = pi.id
      JOIN public.product_properties pp ON pp.id = pia.property_id
      WHERE pp.attribute_name = f.attribute_name AND pia.property_value = ANY(f.values)
    ), 0) = (SELECT COUNT(*) FROM filters)
  ),
  tracked_items AS (
    SELECT pi.id, pi.item_code, pi.status
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
      AND (
        NOT EXISTS (SELECT 1 FROM jsonb_each(COALESCE(filter_attributes, '{}'::jsonb)))
        OR pi.id IN (SELECT id FROM matching_items)
      )
  )
  SELECT COUNT(*) INTO tracked_total FROM tracked_items;

  bulk_pool := GREATEST(total_stock - tracked_total, 0);

  -- Individual tracked items with availability across the whole range + attributes map
  WITH filters AS (
    SELECT key AS attribute_name,
           CASE 
             WHEN jsonb_typeof(value) = 'array' THEN ARRAY(SELECT elem->>0 FROM jsonb_array_elements(value) elem)
             ELSE ARRAY[value::text]
           END AS values
    FROM jsonb_each(COALESCE(filter_attributes, '{}'::jsonb))
  ),
  matching_items AS (
    SELECT pi.id
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
    GROUP BY pi.id
    HAVING COALESCE((
      SELECT COUNT(DISTINCT f.attribute_name)
      FROM filters f
      JOIN public.product_item_attributes pia ON pia.item_id = pi.id
      JOIN public.product_properties pp ON pp.id = pia.property_id
      WHERE pp.attribute_name = f.attribute_name AND pia.property_value = ANY(f.values)
    ), 0) = (SELECT COUNT(*) FROM filters)
  ),
  ti AS (
    SELECT pi.id, pi.item_code, pi.status
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
      AND (
        NOT EXISTS (SELECT 1 FROM jsonb_each(COALESCE(filter_attributes, '{}'::jsonb)))
        OR pi.id IN (SELECT id FROM matching_items)
      )
  ),
  conflicts AS (
    SELECT DISTINCT ea.product_item_id AS item_id
    FROM public.equipment_assignments ea
    WHERE ea.product_item_id IN (SELECT id FROM ti)
      AND ea.status IN ('assigned','delivered','in_service')
      AND ea.assigned_date <= end_date
      AND (ea.return_date IS NULL OR ea.return_date >= start_date)
  ),
  attrs AS (
    SELECT pia.item_id AS item_id,
           jsonb_object_agg(pp.attribute_name, pia.property_value) AS attrs_map
    FROM public.product_item_attributes pia
    JOIN public.product_properties pp ON pp.id = pia.property_id
    WHERE pia.item_id IN (SELECT id FROM ti)
    GROUP BY pia.item_id
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'item_id', t.id,
      'item_code', t.item_code,
      'status', t.status,
      'is_available', NOT EXISTS(SELECT 1 FROM conflicts c WHERE c.item_id = t.id),
      'attributes', COALESCE(a.attrs_map, '{}'::jsonb)
    )
  ), '[]'::jsonb)
  INTO individual_items_json
  FROM ti t
  LEFT JOIN attrs a ON a.item_id = t.id;

  -- Daily breakdown
  WITH filters AS (
    SELECT key AS attribute_name,
           CASE 
             WHEN jsonb_typeof(value) = 'array' THEN ARRAY(SELECT elem->>0 FROM jsonb_array_elements(value) elem)
             ELSE ARRAY[value::text]
           END AS values
    FROM jsonb_each(COALESCE(filter_attributes, '{}'::jsonb))
  ),
  matching_items AS (
    SELECT pi.id
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
    GROUP BY pi.id
    HAVING COALESCE((
      SELECT COUNT(DISTINCT f.attribute_name)
      FROM filters f
      JOIN public.product_item_attributes pia ON pia.item_id = pi.id
      JOIN public.product_properties pp ON pp.id = pia.property_id
      WHERE pp.attribute_name = f.attribute_name AND pia.property_value = ANY(f.values)
    ), 0) = (SELECT COUNT(*) FROM filters)
  ),
  tracked_items AS (
    SELECT pi.id, pi.item_code, pi.status
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
      AND (
        NOT EXISTS (SELECT 1 FROM jsonb_each(COALESCE(filter_attributes, '{}'::jsonb)))
        OR pi.id IN (SELECT id FROM matching_items)
      )
  ),
  dates AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS d
  ),
  conflicts_specific AS (
    SELECT ea.id AS assignment_id, ea.product_item_id AS item_id, ea.status, ea.assigned_date, ea.return_date, ea.job_id
    FROM public.equipment_assignments ea
    WHERE ea.product_item_id IN (SELECT id FROM tracked_items)
      AND ea.status IN ('assigned','delivered','in_service')
  ),
  conflicts_bulk AS (
    SELECT ea.id AS assignment_id, ea.quantity, ea.status, ea.assigned_date, ea.return_date, ea.job_id
    FROM public.equipment_assignments ea
    WHERE ea.product_id = product_type_id
      AND ea.product_item_id IS NULL
      AND ea.status IN ('assigned','delivered','in_service')
  ),
  tracked_available_by_day AS (
    SELECT d.d,
      COUNT(*) FILTER (
        WHERE pi.status = 'available' 
          AND NOT EXISTS (
            SELECT 1 FROM conflicts_specific cs
            WHERE cs.item_id = pi.id 
              AND cs.assigned_date <= d.d 
              AND (cs.return_date IS NULL OR cs.return_date >= d.d)
          )
      ) AS tracked_available,
      COUNT(*) AS tracked_total
    FROM dates d
    CROSS JOIN tracked_items pi
    GROUP BY d.d
  ),
  bulk_assigned_by_day AS (
    SELECT d.d,
      COALESCE(SUM(
        CASE WHEN cb.assigned_date <= d.d AND (cb.return_date IS NULL OR cb.return_date >= d.d) THEN cb.quantity ELSE 0 END
      ),0) AS bulk_assigned
    FROM dates d
    LEFT JOIN conflicts_bulk cb ON TRUE
    GROUP BY d.d
  ),
  merged AS (
    SELECT
      d.d AS date,
      GREATEST(bulk_pool - ba.bulk_assigned, 0) AS bulk_available,
      ba.bulk_assigned,
      tav.tracked_available,
      (tav.tracked_total - tav.tracked_available) AS tracked_assigned,
      GREATEST(bulk_pool - ba.bulk_assigned, 0) + tav.tracked_available AS total_available
    FROM dates d
    LEFT JOIN bulk_assigned_by_day ba ON ba.d = d.d
    LEFT JOIN tracked_available_by_day tav ON tav.d = d.d
  ),
  conflicts_list AS (
    SELECT d.d AS date,
      jsonb_agg(
        jsonb_build_object(
          'assignment_id', ea.id,
          'job_number', j.job_number,
          'customer_name', c.name,
          'item_id', ea.product_item_id,
          'status', ea.status
        )
      ) FILTER (WHERE ea.id IS NOT NULL) AS conflicts
    FROM dates d
    LEFT JOIN public.equipment_assignments ea
      ON (
        (ea.product_item_id IN (SELECT id FROM tracked_items)
         OR (ea.product_id = product_type_id AND ea.product_item_id IS NULL)
        )
        AND ea.status IN ('assigned','delivered','in_service')
        AND ea.assigned_date <= d.d
        AND (ea.return_date IS NULL OR ea.return_date >= d.d)
      )
    LEFT JOIN public.jobs j ON j.id = ea.job_id
    LEFT JOIN public.customers c ON c.id = j.customer_id
    GROUP BY d.d
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'date', merged.date::text,
      'bulk_available', merged.bulk_available,
      'bulk_assigned', merged.bulk_assigned,
      'tracked_available', merged.tracked_available,
      'tracked_assigned', merged.tracked_assigned,
      'total_available', merged.total_available,
      'conflicts', COALESCE(cl.conflicts, '[]'::jsonb)
    ) ORDER BY merged.date
  ), '[]'::jsonb)
  INTO daily
  FROM merged
  LEFT JOIN conflicts_list cl ON cl.date = merged.date;

  -- Overall availability is the minimum daily total_available (date-range request)
  SELECT MIN((x->>'total_available')::int),
         MAX((x->>'total_available')::int),
         AVG((x->>'total_available')::numeric),
         COALESCE(MIN((x->>'total_available')::int), 0)
  INTO min_avail, max_avail, avg_avail, available_overall
  FROM jsonb_array_elements(daily) x;

  summary_json := jsonb_build_object(
    'min_available', COALESCE(min_avail, 0),
    'max_available', COALESCE(max_avail, 0),
    'avg_available', COALESCE(avg_avail, 0),
    'bulk_pool', bulk_pool,
    'tracked_units', tracked_total
  );

  RETURN jsonb_build_object(
    'available', COALESCE(available_overall, 0),
    'total', total_stock,
    'method', method_text,
    'individual_items', individual_items_json,
    'daily_breakdown', daily,
    'summary', summary_json
  );
END;
$$;

-- 2) Performance indexes to speed up availability lookups
CREATE INDEX IF NOT EXISTS idx_pia_item ON public.product_item_attributes(item_id);
CREATE INDEX IF NOT EXISTS idx_pia_prop_value ON public.product_item_attributes(property_id, property_value);
CREATE INDEX IF NOT EXISTS idx_ea_item_dates_status ON public.equipment_assignments(product_item_id, status, assigned_date, return_date);
CREATE INDEX IF NOT EXISTS idx_ea_product_dates_status ON public.equipment_assignments(product_id, status, assigned_date, return_date);
CREATE INDEX IF NOT EXISTS idx_pi_product_status ON public.product_items(product_id, status);
