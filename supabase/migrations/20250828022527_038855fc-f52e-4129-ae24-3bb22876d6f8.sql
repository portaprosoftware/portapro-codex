-- Create table for tracking individual product item location transfers
CREATE TABLE IF NOT EXISTS public.product_item_location_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES public.storage_locations(id),
  to_location_id UUID NOT NULL REFERENCES public.storage_locations(id),
  transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transferred_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_item_location_transfers_product_item_id 
ON public.product_item_location_transfers(product_item_id);

CREATE INDEX IF NOT EXISTS idx_product_item_location_transfers_product_id 
ON public.product_item_location_transfers(product_id);

CREATE INDEX IF NOT EXISTS idx_product_item_location_transfers_transferred_at 
ON public.product_item_location_transfers(transferred_at DESC);

-- Add RLS policies (following the custom instructions - no RLS policies)
ALTER TABLE public.product_item_location_transfers ENABLE ROW LEVEL SECURITY;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_product_item_location_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.transferred_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_item_location_transfers_updated_at
    BEFORE UPDATE ON public.product_item_location_transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_item_location_transfers_updated_at();