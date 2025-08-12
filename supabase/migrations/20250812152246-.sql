-- Add enhanced driver credentials fields for robust CDL tracking
ALTER TABLE public.driver_credentials 
ADD COLUMN IF NOT EXISTS license_category text CHECK (license_category IN ('NON_CDL', 'CDL')),
ADD COLUMN IF NOT EXISTS cdl_class text CHECK (cdl_class IN ('A', 'B', 'C')),
ADD COLUMN IF NOT EXISTS license_restrictions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS operating_scope text CHECK (operating_scope IN ('INTERSTATE', 'INTRASTATE')) DEFAULT 'INTERSTATE',
ADD COLUMN IF NOT EXISTS notes text;

-- Update the existing license_class field to allow proper values if it doesn't already
-- (keeping it for backward compatibility but will use cdl_class going forward)

-- Add comments for clarity
COMMENT ON COLUMN public.driver_credentials.license_category IS 'NON_CDL for regular licenses, CDL for commercial';
COMMENT ON COLUMN public.driver_credentials.cdl_class IS 'CDL class A, B, or C - only relevant if license_category is CDL';
COMMENT ON COLUMN public.driver_credentials.license_restrictions IS 'Array of restriction codes like L, E, K, or custom restrictions';
COMMENT ON COLUMN public.driver_credentials.operating_scope IS 'INTERSTATE or INTRASTATE - affects compliance requirements';
COMMENT ON COLUMN public.driver_credentials.notes IS 'Additional non-sensitive notes about driver credentials';