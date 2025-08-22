-- Add tax configuration to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS tax_method text DEFAULT 'flat' CHECK (tax_method IN ('flat', 'state_based', 'zip_based')),
ADD COLUMN IF NOT EXISTS flat_tax_rate numeric DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS state_tax_rates jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS zip_tax_overrides jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tax_enabled boolean DEFAULT true;

-- Create tax_rates table for ZIP-based overrides
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code text NOT NULL,
  tax_rate numeric NOT NULL DEFAULT 0.00,
  state text,
  city text,
  county text,
  description text,
  effective_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index on zip_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_rates_zip_code ON public.tax_rates(zip_code);

-- Add trigger for updated_at
CREATE TRIGGER update_tax_rates_updated_at
  BEFORE UPDATE ON public.tax_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();