-- Add Tier 1 fields to mobile_fuel_vendors table
ALTER TABLE public.mobile_fuel_vendors
ADD COLUMN IF NOT EXISTS vendor_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS after_hours_contact_person TEXT,
ADD COLUMN IF NOT EXISTS after_hours_phone TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'phone',
ADD COLUMN IF NOT EXISTS delivery_hours TEXT,
ADD COLUMN IF NOT EXISTS min_delivery_quantity_gal INTEGER,
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net_30';

-- Create function to auto-generate vendor IDs
CREATE OR REPLACE FUNCTION public.generate_vendor_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  generated_id TEXT;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(
    CASE 
      WHEN vendor_id ~ '^VEND-[0-9]+$'
      THEN CAST(SUBSTRING(vendor_id FROM 6) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1 
  INTO next_number
  FROM public.mobile_fuel_vendors;
  
  -- Format: VEND-001
  generated_id := 'VEND-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN generated_id;
END;
$$;

-- Create trigger to auto-set vendor_id on insert
CREATE OR REPLACE FUNCTION public.set_mobile_vendor_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.vendor_id IS NULL THEN
    NEW.vendor_id := public.generate_vendor_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_mobile_vendor_id ON public.mobile_fuel_vendors;
CREATE TRIGGER trigger_set_mobile_vendor_id
BEFORE INSERT ON public.mobile_fuel_vendors
FOR EACH ROW
EXECUTE FUNCTION public.set_mobile_vendor_id();

-- Add check constraints for enum-like fields
ALTER TABLE public.mobile_fuel_vendors
DROP CONSTRAINT IF EXISTS check_preferred_contact_method,
ADD CONSTRAINT check_preferred_contact_method 
  CHECK (preferred_contact_method IN ('phone', 'email', 'portal', 'text'));

ALTER TABLE public.mobile_fuel_vendors
DROP CONSTRAINT IF EXISTS check_pricing_model,
ADD CONSTRAINT check_pricing_model 
  CHECK (pricing_model IN ('fixed', 'market_index', 'cost_plus', 'tiered'));

ALTER TABLE public.mobile_fuel_vendors
DROP CONSTRAINT IF EXISTS check_payment_terms,
ADD CONSTRAINT check_payment_terms 
  CHECK (payment_terms IN ('net_15', 'net_30', 'cod', 'prepaid'));