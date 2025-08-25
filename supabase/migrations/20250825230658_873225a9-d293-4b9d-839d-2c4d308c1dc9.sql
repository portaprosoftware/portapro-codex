-- Fix unified stock calculation to anchor on product.stock_total and correct reservations
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  tracked_total INTEGER := 0;
  individual_available INTEGER := 0;
  individual_maintenance INTEGER := 0;
  reserved_individual INTEGER := 0;
  bulk_pool INTEGER := 0;
  bulk_reserved INTEGER := 0;
  bulk_available INTEGER := 0;
  location_breakdown jsonb := '[]'::jsonb;
  total_reserved INTEGER := 0;
  physically_available INTEGER := 0;
  result jsonb;
BEGIN
  -- Get product information (authoritative master total)
  SELECT id, name, stock_total, track_inventory
  INTO product_record
  FROM public.products
  WHERE id = product_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Tracked item totals
  SELECT COUNT(*)
  INTO tracked_total
  FROM public.product_items
  WHERE product_id = product_uuid;

  SELECT COUNT(*)
  INTO individual_available
  FROM public.product_items
  WHERE product_id = product_uuid AND status = 'available';

  SELECT COUNT(*)
  INTO individual_maintenance
  FROM public.product_items
  WHERE product_id = product_uuid AND status = 'maintenance';

  -- Individual reservations based on active assignments (current on-job)
  SELECT COUNT(DISTINCT ea.product_item_id)
  INTO reserved_individual
  FROM public.equipment_assignments ea
  WHERE ea.product_item_id IN (
      SELECT id FROM public.product_items WHERE product_id = product_uuid
  )
    AND ea.status IN ('assigned', 'delivered', 'in_service');

  -- Bulk pool is the remainder after tracked items
  bulk_pool := GREATEST(COALESCE(product_record.stock_total, 0) - tracked_total, 0);

  -- Bulk reservations for active assignments (no specific item)
  SELECT COALESCE(SUM(ea.quantity), 0)
  INTO bulk_reserved
  FROM public.equipment_assignments ea
  WHERE ea.product_id = product_uuid
    AND ea.product_item_id IS NULL
    AND ea.status IN ('assigned', 'delivered', 'in_service');

  bulk_available := GREATEST(bulk_pool - bulk_reserved, 0);
  total_reserved := reserved_individual + bulk_reserved;
  physically_available := individual_available + bulk_available;

  -- Location breakdown is informative only (does not drive totals)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'location_id', pls.storage_location_id,
      'location_name', sl.name,
      'bulk_quantity', pls.quantity
    )
  ), '[]'::jsonb)
  INTO location_breakdown
  FROM public.product_location_stock pls
  JOIN public.storage_locations sl ON sl.id = pls.storage_location_id
  WHERE pls.product_id = product_uuid AND pls.quantity > 0;

  -- Build normalized result compatible with frontend expectations
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock', product_record.stock_total,
    'individual_items', jsonb_build_object(
      'total', tracked_total,
      'available', individual_available,
      'maintenance', individual_maintenance,
      -- Items not available due to any non-available/maintenance status
      'assigned', GREATEST(tracked_total - individual_available - individual_maintenance, 0),
      -- Explicit reservation count from assignments
      'reserved', reserved_individual
    ),
    'bulk_stock', jsonb_build_object(
      'pool_available', bulk_available,
      'reserved', bulk_reserved,
      'location_breakdown', location_breakdown
    ),
    'totals', jsonb_build_object(
      'physically_available', physically_available,
      'total_reserved', total_reserved,
      'in_maintenance', individual_maintenance,
      'tracked_individual', tracked_total,
      'bulk_pool', bulk_pool
    ),
    'tracking_method', CASE 
      WHEN tracked_total > 0 AND bulk_pool > 0 THEN 'hybrid'
      WHEN tracked_total > 0 THEN 'individual'
      WHEN bulk_pool > 0 THEN 'bulk'
      ELSE 'none'
    END,
    'generated_at', now()
  );

  RETURN result;
END;
$$;