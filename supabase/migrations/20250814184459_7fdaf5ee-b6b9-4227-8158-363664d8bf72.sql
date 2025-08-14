-- Fix stock total calculation in get_unified_product_stock function
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
  calculated_master_stock INTEGER := 0;
  result jsonb;
BEGIN
  -- Get product information
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Calculate true master stock from location stock (like Site Stock breakdown does)
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

  -- Get total bulk stock (same as calculated_master_stock)
  bulk_stock := calculated_master_stock;

  -- Get individual item counts
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available
  INTO individual_count, individual_available
  FROM public.product_items 
  WHERE product_id = product_uuid;

  -- Build comprehensive result using calculated master stock
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock_total', calculated_master_stock,
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