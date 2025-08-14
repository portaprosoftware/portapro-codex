-- Fix unified stock function to return frontend-compatible structure
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  calculated_master_stock INTEGER := 0;
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

  -- Calculate master stock from actual location stock (corrected calculation)
  SELECT COALESCE(SUM(quantity), 0) INTO calculated_master_stock
  FROM public.product_location_stock
  WHERE product_id = product_uuid;

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

  -- Get individual item counts
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available
  INTO individual_count, individual_available
  FROM public.product_items 
  WHERE product_id = product_uuid;

  -- Build result in the structure frontend expects
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock', calculated_master_stock,
    'individual_items', jsonb_build_object(
      'total_tracked', individual_count,
      'available', individual_available,
      'assigned', individual_count - individual_available,
      'maintenance', 0,
      'reserved', 0
    ),
    'bulk_stock', jsonb_build_object(
      'pool_available', GREATEST(0, calculated_master_stock - individual_count),
      'reserved', 0,
      'location_breakdown', COALESCE(location_breakdown, '[]'::jsonb)
    ),
    'totals', jsonb_build_object(
      'physically_available', individual_available + GREATEST(0, calculated_master_stock - individual_count),
      'total_reserved', 0,
      'in_maintenance', 0,
      'tracked_individual', individual_count,
      'bulk_pool', GREATEST(0, calculated_master_stock - individual_count)
    ),
    'tracking_method', CASE 
      WHEN individual_count > 0 AND calculated_master_stock > individual_count THEN 'hybrid'
      WHEN individual_count > 0 THEN 'individual'
      WHEN calculated_master_stock > 0 THEN 'bulk'
      ELSE 'none'
    END,
    'last_updated', now()::text
  );
  
  RETURN result;
END;
$$;