-- Fix convert_bulk_to_tracked to use location stock (bulk pool) rather than products.stock_total - tracked count
-- This aligns the conversion logic with UI/analytics that read from product_location_stock

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
  total_bulk INTEGER := 0;
  remaining INTEGER := 0;
  rec RECORD;
  total_tracked INTEGER := 0;
  new_items JSONB := '[]'::jsonb;
  new_item_code TEXT;
  new_id UUID;
  category_prefix TEXT;
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

  -- Determine current bulk pool from location stock
  SELECT COALESCE(SUM(quantity), 0) INTO total_bulk
  FROM public.product_location_stock pls
  WHERE pls.product_id = product_uuid;

  IF total_bulk < convert_qty THEN
    RAISE EXCEPTION 'Insufficient bulk pool (%). Requested %', total_bulk, convert_qty;
  END IF;

  -- Decrement from location stock, preferring default storage location first
  remaining := convert_qty;

  FOR rec IN
    SELECT id, storage_location_id, quantity
    FROM public.product_location_stock
    WHERE product_id = product_uuid
    ORDER BY CASE WHEN storage_location_id = product_rec.default_storage_location_id THEN 0 ELSE 1 END, quantity DESC
  LOOP
    EXIT WHEN remaining <= 0;

    IF rec.quantity > 0 THEN
      -- Deduct as much as possible from this row
      PERFORM 1;
      UPDATE public.product_location_stock
      SET quantity = GREATEST(0, quantity - LEAST(remaining, rec.quantity))
      WHERE id = rec.id;

      remaining := remaining - LEAST(remaining, rec.quantity);
    END IF;
  END LOOP;

  IF remaining > 0 THEN
    -- Safety check; should never happen due to earlier validation
    RAISE EXCEPTION 'Failed to deduct full conversion amount. Remaining: %', remaining;
  END IF;

  -- Create tracked items (available) without changing master stock
  category_prefix := COALESCE(product_rec.default_item_code_category, '3000');

  FOR _ IN 1..convert_qty LOOP
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

  -- Recompute totals for response
  SELECT COUNT(*) INTO total_tracked
  FROM public.product_items pi
  WHERE pi.product_id = product_uuid;

  SELECT COALESCE(SUM(quantity), 0) INTO total_bulk
  FROM public.product_location_stock pls
  WHERE pls.product_id = product_uuid;

  -- Touch updated_at so observers can refetch
  UPDATE public.products SET updated_at = now() WHERE id = product_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'convert_bulk_to_tracked',
    'product_id', product_uuid,
    'created_items', new_items,
    'updated_totals', jsonb_build_object(
      'master_stock', COALESCE((SELECT stock_total FROM public.products WHERE id = product_uuid), 0),
      'total_tracked', total_tracked,
      'bulk_pool', total_bulk
    )
  );
END;
$$;