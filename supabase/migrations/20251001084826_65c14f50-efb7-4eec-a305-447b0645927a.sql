-- Unified Storage Locations - Two-phase migration

-- Phase 1: Add columns from spill_kit_storage_locations to storage_locations
ALTER TABLE public.storage_locations
ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'warehouse',
ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS capacity_limit integer,
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add CHECK constraint
ALTER TABLE public.storage_locations
DROP CONSTRAINT IF EXISTS storage_locations_location_type_check;

ALTER TABLE public.storage_locations
ADD CONSTRAINT storage_locations_location_type_check 
CHECK (location_type IN ('warehouse', 'vehicle', 'facility', 'mobile', 'other'));

-- Phase 2: Migrate data from spill_kit_storage_locations
INSERT INTO public.storage_locations (
  name,
  address_type,
  company_address_id,
  custom_street,
  custom_city,
  custom_state,
  custom_zip,
  gps_coordinates,
  is_default,
  is_active,
  created_at,
  updated_at,
  location_type,
  vehicle_id,
  capacity_limit,
  contact_person,
  contact_phone,
  notes
)
SELECT 
  sksl.name,
  sksl.address_type,
  NULL,
  CASE WHEN sksl.address_type = 'custom' THEN sksl.address_custom ELSE NULL END,
  NULL,
  NULL,
  NULL,
  CASE 
    WHEN sksl.address_gps_lat IS NOT NULL AND sksl.address_gps_lng IS NOT NULL 
    THEN point(sksl.address_gps_lng, sksl.address_gps_lat)
    ELSE NULL
  END,
  sksl.is_default,
  sksl.is_active,
  sksl.created_at,
  sksl.updated_at,
  COALESCE(sksl.location_type, 'warehouse'),
  sksl.vehicle_id,
  sksl.capacity_limit,
  sksl.contact_person,
  sksl.contact_phone,
  sksl.notes
FROM public.spill_kit_storage_locations sksl
WHERE NOT EXISTS (
  SELECT 1 FROM public.storage_locations sl WHERE sl.name = sksl.name
);

-- Phase 3: Update foreign keys in spill_kit_location_stock
CREATE TEMP TABLE spill_loc_mapping AS
SELECT sksl.id as old_id, sl.id as new_id
FROM public.spill_kit_storage_locations sksl
JOIN public.storage_locations sl ON sl.name = sksl.name;

ALTER TABLE public.spill_kit_location_stock 
DROP CONSTRAINT IF EXISTS spill_kit_location_stock_storage_location_id_fkey;

UPDATE public.spill_kit_location_stock skls
SET storage_location_id = slm.new_id
FROM spill_loc_mapping slm
WHERE skls.storage_location_id = slm.old_id;

ALTER TABLE public.spill_kit_location_stock
ADD CONSTRAINT spill_kit_location_stock_storage_location_id_fkey 
FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id) ON DELETE CASCADE;

-- Phase 4: Drop old table
DROP TABLE IF EXISTS public.spill_kit_storage_locations CASCADE;

COMMENT ON TABLE public.storage_locations IS 'Unified storage for inventory, spill kits, vehicles';