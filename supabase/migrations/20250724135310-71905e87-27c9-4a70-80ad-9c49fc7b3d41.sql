-- Create consumable bundles table
CREATE TABLE public.consumable_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consumable bundle items table (junction table)
CREATE TABLE public.consumable_bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.consumable_bundles(id) ON DELETE CASCADE,
  consumable_id UUID NOT NULL REFERENCES public.consumables(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to jobs table for consumables billing
ALTER TABLE public.jobs ADD COLUMN billing_method TEXT DEFAULT 'per-use';
ALTER TABLE public.jobs ADD COLUMN subscription_plan TEXT;

-- Enable RLS on new tables
ALTER TABLE public.consumable_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_bundle_items ENABLE ROW LEVEL SECURITY;

-- Create policies for consumable bundles
CREATE POLICY "Public access to consumable bundles"
ON public.consumable_bundles
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for consumable bundle items
CREATE POLICY "Public access to consumable bundle items"
ON public.consumable_bundle_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default bundles
INSERT INTO public.consumable_bundles (name, description, price) VALUES
('Basic Bundle', '1 Urinal Cake, 1 Sanitizer Refill, 1 Toilet Paper Roll, 20 Wipes', 15.00),
('Standard Bundle', '2 Urinal Cakes, 2 Sanitizer Refills, 2 Toilet Rolls, 50 Wipes, 1 Floor Mat', 30.00),
('Premium Bundle', 'Unlimited paper & sanitizer, 5 Urinal Cakes, 2 Wipes, 1 Mat', 50.00);

-- Add update triggers for timestamps
CREATE TRIGGER update_consumable_bundles_updated_at
  BEFORE UPDATE ON public.consumable_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();