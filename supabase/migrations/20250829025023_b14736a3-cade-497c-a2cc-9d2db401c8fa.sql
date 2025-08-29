
-- 1) Tracked-only unified stock function
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_tracked     INTEGER := 0;
  available_count   INTEGER := 0;
  assigned_count    INTEGER := 0;
  maintenance_count INTEGER := 0;
BEGIN
  -- Ensure product exists
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = product_uuid) THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Count tracked units by status
  SELECT
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*) FILTER (WHERE status = 'assigned'),
    COUNT(*) FILTER (WHERE status = 'maintenance'),
    COUNT(*)
  INTO
    available_count,
    assigned_count,
    maintenance_count,
    total_tracked
  FROM public.product_items
  WHERE product_id = product_uuid;

  -- Tracked-only response
  RETURN jsonb_build_object(
    'product_id', product_uuid,
    'master_stock_total', COALESCE(total_tracked, 0),
    'individual_items', jsonb_build_object(
      'total_tracked', COALESCE(total_tracked, 0),
      'available', COALESCE(available_count, 0),
      'assigned', COALESCE(assigned_count, 0),
      'maintenance', COALESCE(maintenance_count, 0)
    ),
    'unified_available', COALESCE(available_count, 0),
    'tracking_method', 'tracked_only'
  );
END;
$$;

-- 2) One-time data sync so any UI referencing products.stock_total also shows the tracked count
UPDATE public.products p
SET stock_total = COALESCE(pi.cnt, 0)
FROM (
  SELECT product_id, COUNT(*) AS cnt
  FROM public.product_items
  GROUP BY product_id
) AS pi
WHERE p.id = pi.product_id;

-- Also set stock_total to 0 for products that currently have no tracked items
UPDATE public.products p
SET stock_total = 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_items i WHERE i.product_id = p.id
);
