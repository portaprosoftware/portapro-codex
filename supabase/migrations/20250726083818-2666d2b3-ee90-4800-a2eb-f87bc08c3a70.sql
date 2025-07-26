-- Phase 5: Unified Stock Query Functions

-- Function to get comprehensive product stock information
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  bulk_stock INTEGER := 0;
  individual_count INTEGER := 0;
  individual_available INTEGER := 0;
  location_breakdown jsonb := '[]'::jsonb;
  result jsonb;
BEGIN
  -- Get product information
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Get bulk stock by location
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

  -- Get total bulk stock
  SELECT COALESCE(SUM(quantity), 0) INTO bulk_stock
  FROM public.product_location_stock
  WHERE product_id = product_uuid;

  -- Get individual item counts
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available
  INTO individual_count, individual_available
  FROM public.product_items 
  WHERE product_id = product_uuid;

  -- Build comprehensive result
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock_total', product_record.stock_total,
    'bulk_stock', jsonb_build_object(
      'total', bulk_stock,
      'location_breakdown', COALESCE(location_breakdown, '[]'::jsonb)
    ),
    'individual_items', jsonb_build_object(
      'total_tracked', individual_count,
      'available', individual_available,
      'assigned', individual_count - individual_available
    ),
    'unified_available', GREATEST(bulk_stock, individual_available),
    'tracking_method', CASE 
      WHEN individual_count > 0 AND bulk_stock > 0 THEN 'hybrid'
      WHEN individual_count > 0 THEN 'individual'
      WHEN bulk_stock > 0 THEN 'bulk'
      ELSE 'none'
    END
  );
  
  RETURN result;
END;
$$;

-- Function to get all available stock across the system
CREATE OR REPLACE FUNCTION public.get_system_wide_availability()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_products INTEGER := 0;
  total_available INTEGER := 0;
  location_summary jsonb := '[]'::jsonb;
  product_summary jsonb := '[]'::jsonb;
  result jsonb;
BEGIN
  -- Get location-wise summary
  SELECT jsonb_agg(
    jsonb_build_object(
      'location_id', sl.id,
      'location_name', sl.name,
      'total_units', COALESCE(location_totals.total, 0),
      'product_count', COALESCE(location_totals.products, 0)
    )
  ) INTO location_summary
  FROM public.storage_locations sl
  LEFT JOIN (
    SELECT 
      pls.storage_location_id,
      SUM(pls.quantity) as total,
      COUNT(DISTINCT pls.product_id) as products
    FROM public.product_location_stock pls
    WHERE pls.quantity > 0
    GROUP BY pls.storage_location_id
  ) location_totals ON location_totals.storage_location_id = sl.id
  WHERE sl.is_active = true;

  -- Get product-wise summary
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_id', p.id,
      'product_name', p.name,
      'total_available', COALESCE(stock_totals.bulk_total, 0),
      'location_count', COALESCE(stock_totals.location_count, 0)
    )
  ) INTO product_summary
  FROM public.products p
  LEFT JOIN (
    SELECT 
      pls.product_id,
      SUM(pls.quantity) as bulk_total,
      COUNT(DISTINCT pls.storage_location_id) as location_count
    FROM public.product_location_stock pls
    WHERE pls.quantity > 0
    GROUP BY pls.product_id
  ) stock_totals ON stock_totals.product_id = p.id
  WHERE p.track_inventory = true;

  -- Get system totals
  SELECT 
    COUNT(DISTINCT p.id),
    COALESCE(SUM(pls.quantity), 0)
  INTO total_products, total_available
  FROM public.products p
  LEFT JOIN public.product_location_stock pls ON pls.product_id = p.id
  WHERE p.track_inventory = true;

  result := jsonb_build_object(
    'system_totals', jsonb_build_object(
      'total_products', total_products,
      'total_available_units', total_available,
      'active_locations', (SELECT COUNT(*) FROM public.storage_locations WHERE is_active = true)
    ),
    'location_summary', COALESCE(location_summary, '[]'::jsonb),
    'product_summary', COALESCE(product_summary, '[]'::jsonb),
    'generated_at', now()
  );
  
  RETURN result;
END;
$$;