-- Create functions to correctly handle inventory flows for bulk vs tracked
-- 1) convert_bulk_to_tracked: does NOT change master stock, only converts pool to tracked items
-- 2) add_tracked_inventory: increases master stock and creates tracked items

-- Function: convert_bulk_to_tracked(product_uuid uuid, convert_qty integer)
CREATE OR REPLACE FUNCTION public.convert_bulk_to_tracked(
  product_uuid uuid,
  convert_qty integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_rec RECORD;
  total_tracked INTEGER := 0;
  bulk_pool INTEGER := 0;
  i INTEGER;
  category_prefix TEXT;
  new_item_code TEXT;
  new_id UUID;
  new_items JSONB := '[]'::jsonb;
BEGIN
  IF convert_qty IS NULL OR convert_qty <= 0 THEN
    RAISE EXCEPTION 'convert_qty must be a positive integer';
  END IF;

  -- Lock product row to avoid race conditions
  SELECT p.* INTO product_rec
  FROM public.products p
  WHERE p.id = product_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found with id: %', product_uuid;
  END IF;

  -- Compute current pool: master - tracked
  SELECT COUNT(*) INTO total_tracked
  FROM public.product_items pi
  WHERE pi.product_id = product_uuid;

  bulk_pool := GREATEST(COALESCE(product_rec.stock_total, 0) - COALESCE(total_tracked, 0), 0);

  IF bulk_pool < convert_qty THEN
    RAISE EXCEPTION 'Insufficient bulk pool (%). Requested %', bulk_pool, convert_qty;
  END IF;

  category_prefix := COALESCE(product_rec.default_item_code_category, '3000');

  -- Create tracked items without changing master stock
  FOR i IN 1..convert_qty LOOP
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

  -- Recompute totals
  SELECT COUNT(*) INTO total_tracked
  FROM public.product_items pi
  WHERE pi.product_id = product_uuid;

  bulk_pool := GREATEST(COALESCE(product_rec.stock_total, 0) - COALESCE(total_tracked, 0), 0);

  RETURN jsonb_build_object(
    'success', true,
    'action', 'convert_bulk_to_tracked',
    'product_id', product_uuid,
    'created_items', new_items,
    'updated_totals', jsonb_build_object(
      'master_stock', product_rec.stock_total,
      'total_tracked', total_tracked,
      'bulk_pool', bulk_pool
    )
  );
END;
$$;

-- Function: add_tracked_inventory(product_uuid uuid, add_qty integer)
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
  i INTEGER;
  category_prefix TEXT;
  new_item_code TEXT;
  new_id UUID;
  new_items JSONB := '[]'::jsonb;
  total_tracked INTEGER := 0;
  bulk_pool INTEGER := 0;
  new_master INTEGER := 0;
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

  category_prefix := COALESCE(product_rec.default_item_code_category, '3000');

  -- Create tracked items
  FOR i IN 1..add_qty LOOP
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

  -- Increase master stock
  UPDATE public.products
  SET stock_total = COALESCE(stock_total, 0) + add_qty,
      updated_at = now()
  WHERE id = product_uuid
  RETURNING stock_total INTO new_master;

  -- Recompute totals
  SELECT COUNT(*) INTO total_tracked
  FROM public.product_items pi
  WHERE pi.product_id = product_uuid;

  bulk_pool := GREATEST(COALESCE(new_master, 0) - COALESCE(total_tracked, 0), 0);

  RETURN jsonb_build_object(
    'success', true,
    'action', 'add_tracked_inventory',
    'product_id', product_uuid,
    'created_items', new_items,
    'updated_totals', jsonb_build_object(
      'master_stock', new_master,
      'total_tracked', total_tracked,
      'bulk_pool', bulk_pool
    )
  );
END;
$$;