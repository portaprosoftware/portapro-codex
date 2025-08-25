-- Fix add_tracked_inventory to properly handle new inventory addition
CREATE OR REPLACE FUNCTION public.add_tracked_inventory(
  product_uuid uuid,
  add_qty integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_rec RECORD;
  new_items JSONB := '[]'::jsonb;
  new_item_code TEXT;
  new_id UUID;
  category_prefix TEXT;
  total_tracked INTEGER := 0;
  total_bulk INTEGER := 0;
  new_master_stock INTEGER := 0;
BEGIN
  IF add_qty IS NULL OR add_qty <= 0 THEN
    RAISE EXCEPTION 'add_qty must be a positive integer';
  END IF;

  -- Lock product row to avoid race conditions
  SELECT p.* INTO product_rec
  FROM public.products p
  WHERE p.id = product_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found with id: %', product_uuid;
  END IF;

  -- Create new tracked items (this is NEW inventory being added)
  category_prefix := COALESCE(product_rec.default_item_code_category, '3000');

  FOR _ IN 1..add_qty LOOP
    new_item_code := public.generate_item_code_with_category(category_prefix);

    INSERT INTO public.product_items (
      product_id,
      item_code,
      status,
      qr_code_data
    ) VALUES (
      product_uuid,
      new_item_code,
      'available',
      new_item_code
    ) RETURNING id INTO new_id;

    new_items := new_items || jsonb_build_object('id', new_id, 'item_code', new_item_code);
  END LOOP;

  -- Increase master stock by the added quantity (this is NEW inventory)
  new_master_stock := COALESCE(product_rec.stock_total, 0) + add_qty;
  
  UPDATE public.products
  SET stock_total = new_master_stock,
      updated_at = now()
  WHERE id = product_uuid;

  -- Calculate totals for response
  SELECT COUNT(*) INTO total_tracked
  FROM public.product_items pi
  WHERE pi.product_id = product_uuid;

  SELECT COALESCE(SUM(quantity), 0) INTO total_bulk
  FROM public.product_location_stock pls
  WHERE pls.product_id = product_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'add_tracked_inventory',
    'product_id', product_uuid,
    'created_items', new_items,
    'updated_totals', jsonb_build_object(
      'master_stock', new_master_stock,
      'total_tracked', total_tracked,
      'bulk_pool', total_bulk
    )
  );
END;
$$;