
-- Fix unified stock function to include bulk reservations and correct totals
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Bulk totals from locations (bulk only)
  bulk_total INTEGER := 0;

  -- Tracked item counts
  individual_count INTEGER := 0;
  individual_available INTEGER := 0;
  individual_assigned INTEGER := 0;
  individual_maintenance INTEGER := 0;
  individual_reserved INTEGER := 0;

  -- Bulk reservations from equipment_assignments
  bulk_reserved INTEGER := 0;

  -- Aggregated totals
  total_reserved INTEGER := 0;
  bulk_pool INTEGER := 0;
  master_stock INTEGER := 0;
  physically_available INTEGER := 0;

  -- Optional location breakdown for bulk
  location_breakdown jsonb := '[]'::jsonb;
BEGIN
  -- Bulk quantity by locations (represents bulk stock only)
  SELECT COALESCE(SUM(quantity), 0)
  INTO bulk_total
  FROM public.product_location_stock
  WHERE product_id = product_uuid;

  -- Tracked item counts by status
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available,
    COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
    COUNT(*) FILTER (WHERE status = 'reserved') as reserved
  INTO individual_count, individual_available, individual_assigned, individual_maintenance, individual_reserved
  FROM public.product_items 
  WHERE product_id = product_uuid;

  -- Bulk reservations from equipment_assignments for this product
  SELECT COALESCE(SUM(quantity), 0)
  INTO bulk_reserved
  FROM public.equipment_assignments
  WHERE product_id = product_uuid
    AND product_item_id IS NULL
    AND status IN ('assigned', 'delivered', 'in_service');

  -- Optional: location breakdown for bulk
  SELECT jsonb_agg(
    jsonb_build_object(
      'location_id', pls.storage_location_id,
      'location_name', sl.name,
      'bulk_quantity', pls.quantity
    )
  )
  INTO location_breakdown
  FROM public.product_location_stock pls
  JOIN public.storage_locations sl ON sl.id = pls.storage_location_id
  WHERE pls.product_id = product_uuid
    AND pls.quantity > 0;

  -- Master stock = bulk (from locations) + tracked count
  master_stock := bulk_total + individual_count;

  -- Available bulk pool = bulk total minus bulk reservations
  bulk_pool := GREATEST(0, bulk_total - bulk_reserved);

  -- Totals
  total_reserved := bulk_reserved + individual_assigned + individual_reserved;
  physically_available := individual_available + bulk_pool;

  RETURN jsonb_build_object(
    'product_id', product_uuid,
    'master_stock', master_stock,

    'individual_items', jsonb_build_object(
      'total_tracked', individual_count,
      'available', individual_available,
      'assigned', individual_assigned,
      'maintenance', individual_maintenance,
      'reserved', individual_reserved
    ),

    'bulk_stock', jsonb_build_object(
      'pool_available', bulk_pool,
      'reserved', bulk_reserved,
      'location_breakdown', COALESCE(location_breakdown, '[]'::jsonb)
    ),

    'totals', jsonb_build_object(
      'physically_available', physically_available,
      'total_reserved', total_reserved,
      'in_maintenance', individual_maintenance,
      'tracked_individual', individual_count,
      'bulk_pool', bulk_pool
    ),

    'tracking_method', CASE 
      WHEN individual_count > 0 AND bulk_pool > 0 THEN 'hybrid'
      WHEN individual_count > 0 THEN 'individual'
      WHEN bulk_total > 0 THEN 'bulk'
      ELSE 'none'
    END,

    'last_updated', now()::text
  );
END;
$$;
