-- Update maintenance_vendors table to have individual address fields and remove status
ALTER TABLE public.maintenance_vendors 
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS address,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS street2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip text;