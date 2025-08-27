-- Sync products to true tracked inventory (all-tracked model)
-- 1) Force tracked mode for all products
UPDATE public.products SET track_inventory = true;

-- 2) Set stock_total = number of tracked items per product
UPDATE public.products p
SET stock_total = COALESCE(pi.cnt, 0)
FROM (
  SELECT product_id, COUNT(*) AS cnt
  FROM public.product_items
  GROUP BY product_id
) pi
WHERE p.id = pi.product_id;

-- 2b) Ensure products without any items get stock_total = 0
UPDATE public.products p
SET stock_total = 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_items pi WHERE pi.product_id = p.id
);

-- 3) Optional clean-up: zero legacy bulk location quantities if the table exists
DO $$
BEGIN
  IF to_regclass('public.product_location_stock') IS NOT NULL THEN
    UPDATE public.product_location_stock SET quantity = 0;
  END IF;
END $$;