-- Create pin inventory assignments table
CREATE TABLE public.pin_inventory_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coordinate_id UUID NOT NULL REFERENCES public.service_location_coordinates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  assigned_quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coordinate_id, product_id)
);

-- Create index for faster queries
CREATE INDEX idx_pin_inventory_assignments_coordinate_id ON public.pin_inventory_assignments(coordinate_id);
CREATE INDEX idx_pin_inventory_assignments_product_id ON public.pin_inventory_assignments(product_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_pin_inventory_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pin_inventory_assignments_updated_at
    BEFORE UPDATE ON public.pin_inventory_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pin_inventory_assignments_updated_at();