-- Create pin_categories table for storing custom GPS pin categories with colors
CREATE TABLE public.pin_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#EF4444', -- Default red color
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, name) -- Ensure unique category names per customer
);

-- Enable RLS
ALTER TABLE public.pin_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public access to pin categories" 
ON public.pin_categories 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_pin_categories_updated_at
BEFORE UPDATE ON public.pin_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default "Uncategorized" category for all existing customers
INSERT INTO public.pin_categories (customer_id, name, color, is_default)
SELECT DISTINCT c.id, 'Uncategorized', '#EF4444', true
FROM public.customers c
WHERE NOT EXISTS (
  SELECT 1 FROM public.pin_categories pc 
  WHERE pc.customer_id = c.id AND pc.name = 'Uncategorized'
);

-- Add color column to service_location_coordinates if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'service_location_coordinates' 
                 AND column_name = 'pin_color') THEN
    ALTER TABLE public.service_location_coordinates 
    ADD COLUMN pin_color TEXT DEFAULT '#EF4444';
  END IF;
END $$;