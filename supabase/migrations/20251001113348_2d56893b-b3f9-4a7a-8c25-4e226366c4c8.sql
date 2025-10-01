-- Create spill kit storage locations table
CREATE TABLE IF NOT EXISTS public.spill_kit_storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'warehouse',
  description TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  contact_person TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for active locations
CREATE INDEX IF NOT EXISTS idx_spill_kit_storage_locations_active 
  ON public.spill_kit_storage_locations(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_spill_kit_storage_locations_updated_at
  BEFORE UPDATE ON public.spill_kit_storage_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();