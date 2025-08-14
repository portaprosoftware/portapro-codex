-- Create table for individual item location transfers
CREATE TABLE public.product_item_location_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES public.storage_locations(id),
  to_location_id UUID REFERENCES public.storage_locations(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transferred_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_product_item_location_transfers_item_id ON public.product_item_location_transfers(product_item_id);
CREATE INDEX idx_product_item_location_transfers_product_id ON public.product_item_location_transfers(product_id);
CREATE INDEX idx_product_item_location_transfers_transferred_at ON public.product_item_location_transfers(transferred_at);

-- Add RLS (Row Level Security) - no auth policies per user instructions
ALTER TABLE public.product_item_location_transfers ENABLE ROW LEVEL SECURITY;

-- Create trigger to auto-update transferred_at
CREATE TRIGGER update_product_item_location_transfers_transferred_at
    BEFORE UPDATE ON public.product_item_location_transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_location_transfers_updated_at();