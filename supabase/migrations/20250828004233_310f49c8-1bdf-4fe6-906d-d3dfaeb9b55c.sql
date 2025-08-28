-- Update unified stock function to tracked-only model
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  individual_count INTEGER := 0;
  individual_available INTEGER := 0;
  result jsonb;
BEGIN
  -- Fetch product
  SELECT * INTO product_record
  FROM public.products
  WHERE id = product_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Count tracked items only
  SELECT 
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE status = 'available')::int AS available
  INTO individual_count, individual_available
  FROM public.product_items
  WHERE product_id = product_uuid;

  -- Build tracked-only response; keep original keys for compatibility
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock_total', product_record.stock_total,
    'bulk_stock', jsonb_build_object(
      'total', 0,
      'location_breakdown', '[]'::jsonb
    ),
    'individual_items', jsonb_build_object(
      'total_tracked', individual_count,
      'available', individual_available,
      'assigned', GREATEST(individual_count - individual_available, 0)
    ),
    'unified_available', individual_available,
    'tracking_method', CASE 
      WHEN individual_count > 0 THEN 'individual'
      ELSE 'none'
    END
  );

  RETURN result;
END;
$$;