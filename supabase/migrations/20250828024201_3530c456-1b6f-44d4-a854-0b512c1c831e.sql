-- Add RLS policies for product_item_location_transfers table (allow all operations as no auth system)
CREATE POLICY "Allow all operations on product_item_location_transfers" 
ON public.product_item_location_transfers 
FOR ALL 
USING (true);