-- Create product_location_transfers table for tracking transfers between locations
CREATE TABLE public.product_location_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_location_id UUID NOT NULL REFERENCES public.storage_locations(id) ON DELETE RESTRICT,
  to_location_id UUID NOT NULL REFERENCES public.storage_locations(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transferred_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_product_location_transfers_product_id ON public.product_location_transfers(product_id);
CREATE INDEX idx_product_location_transfers_transferred_at ON public.product_location_transfers(transferred_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_product_location_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.transferred_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;