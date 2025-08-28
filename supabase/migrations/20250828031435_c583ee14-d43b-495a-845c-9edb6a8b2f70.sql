
  -- Ensure RLS allows inserting transfer records (and reading them) since there’s no auth layer now

-- 1) Enable RLS on the table (safe if already enabled)
ALTER TABLE public.product_item_location_transfers ENABLE ROW LEVEL SECURITY;

-- 2) Create permissive policies (drop and recreate to be idempotent)
DROP POLICY IF EXISTS "Allow all operations on product_item_location_transfers" ON public.product_item_location_transfers;

CREATE POLICY "Allow all operations on product_item_location_transfers"
  ON public.product_item_location_transfers
  FOR ALL
  USING (true)
  WITH CHECK (true);
  