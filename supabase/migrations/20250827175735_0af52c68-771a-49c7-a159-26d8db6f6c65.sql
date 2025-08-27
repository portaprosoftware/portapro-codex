-- Add helpful indexes for availability calculations
CREATE INDEX IF NOT EXISTS idx_ea_bulk_active_by_product_dates
  ON public.equipment_assignments (product_id, assigned_date, return_date)
  WHERE product_item_id IS NULL AND status IN ('assigned','delivered','in_service');

CREATE INDEX IF NOT EXISTS idx_ea_tracked_active_by_item_dates
  ON public.equipment_assignments (product_item_id, assigned_date, return_date)
  WHERE product_item_id IS NOT NULL AND status IN ('assigned','delivered','in_service');

CREATE INDEX IF NOT EXISTS idx_product_items_product_status
  ON public.product_items (product_id, status);

CREATE INDEX IF NOT EXISTS idx_pls_product
  ON public.product_location_stock (product_id);

-- Update unified stock function to account for bulk reservations and on-job units
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  -- Bulk
  bulk_stock_total INTEGER := 0;
  bulk_assigned_now INTEGER := 0;
  bulk_reserved_future INTEGER := 0;
  bulk_available_now INTEGER := 0;
  location_breakdown jsonb := '[]'::jsonb;
  -- Tracked
  tracked_total INTEGER := 0;
  tracked_assigned_now INTEGER := 0;
  tracked_available_now INTEGER := 0;
  -- Unified
  unified_available_now INTEGER := 0;
  computed_total INTEGER := 0;
  consistency boolean := true;
  result jsonb;
BEGIN
  -- Get product
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Bulk by location (current on-hand at locations)
  SELECT jsonb_agg(
    jsonb_build_object(
      'location_id', pls.storage_location_id,
      'location_name', sl.name,
      'bulk_quantity', pls.quantity
    )
  ) INTO location_breakdown
  FROM public.product_location_stock pls
  JOIN public.storage_locations sl ON sl.id = pls.storage_location_id
  WHERE pls.product_id = product_uuid AND pls.quantity > 0;

  -- Bulk totals (pool tracked at locations)
  SELECT COALESCE(SUM(quantity), 0) INTO bulk_stock_total
  FROM public.product_location_stock
  WHERE product_id = product_uuid;

  -- Tracked totals
  SELECT COUNT(*) INTO tracked_total
  FROM public.product_items pi
  WHERE pi.product_id = product_uuid;

  -- Tracked currently assigned via specific item assignments overlapping today
  SELECT COALESCE(COUNT(DISTINCT ea.product_item_id), 0) INTO tracked_assigned_now
  FROM public.equipment_assignments ea
  JOIN public.product_items pi ON pi.id = ea.product_item_id
  WHERE pi.product_id = product_uuid
    AND ea.product_item_id IS NOT NULL
    AND ea.status IN ('assigned','delivered','in_service')
    AND ea.assigned_date <= CURRENT_DATE
    AND (ea.return_date IS NULL OR ea.return_date >= CURRENT_DATE);

  tracked_available_now := GREATEST(tracked_total - tracked_assigned_now, 0);

  -- Bulk currently assigned via bulk reservations overlapping today
  SELECT COALESCE(SUM(ea.quantity), 0) INTO bulk_assigned_now
  FROM public.equipment_assignments ea
  WHERE ea.product_id = product_uuid
    AND ea.product_item_id IS NULL
    AND ea.status IN ('assigned','delivered','in_service')
    AND ea.assigned_date <= CURRENT_DATE
    AND (ea.return_date IS NULL OR ea.return_date >= CURRENT_DATE);

  -- Bulk reserved for future dates (do not subtract from today, but expose for visibility)
  SELECT COALESCE(SUM(ea.quantity), 0) INTO bulk_reserved_future
  FROM public.equipment_assignments ea
  WHERE ea.product_id = product_uuid
    AND ea.product_item_id IS NULL
    AND ea.status IN ('assigned')
    AND ea.assigned_date > CURRENT_DATE;

  bulk_available_now := GREATEST(bulk_stock_total - bulk_assigned_now, 0);

  unified_available_now := bulk_available_now + tracked_available_now;

  computed_total := bulk_stock_total + tracked_total;
  consistency := (product_record.stock_total IS NULL) OR (product_record.stock_total = computed_total);

  -- Build result
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock_total', product_record.stock_total,
    'bulk_stock', jsonb_build_object(
      'total', bulk_stock_total,
      'available', bulk_available_now,
      'assigned_now', bulk_assigned_now,
      'reserved_future', bulk_reserved_future,
      'location_breakdown', COALESCE(location_breakdown, '[]'::jsonb)
    ),
    'individual_items', jsonb_build_object(
      'total_tracked', tracked_total,
      'available', tracked_available_now,
      'assigned', tracked_assigned_now
    ),
    'unified_available', unified_available_now,
    'tracking_method', CASE 
      WHEN tracked_total > 0 AND bulk_stock_total > 0 THEN 'hybrid'
      WHEN tracked_total > 0 THEN 'individual'
      WHEN bulk_stock_total > 0 THEN 'bulk'
      ELSE 'none'
    END,
    'totals', jsonb_build_object(
      'computed_total', computed_total,
      'consistent_with_master', consistency,
      'discrepancy', CASE WHEN product_record.stock_total IS NOT NULL THEN (computed_total - product_record.stock_total) ELSE 0 END
    ),
    'generated_at', now()
  );
  
  RETURN result;
END;
$$;