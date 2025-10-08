-- Backfill existing fuel_logs with appropriate fuel_source values
UPDATE public.fuel_logs
SET fuel_source = CASE
  WHEN fuel_station IS NOT NULL AND fuel_station != '' THEN 'retail_station'::fuel_source
  WHEN fuel_tank_id IS NOT NULL THEN 'yard_tank'::fuel_source
  WHEN mobile_vendor_id IS NOT NULL THEN 'mobile_vendor'::fuel_source
  ELSE 'retail_station'::fuel_source
END
WHERE fuel_source IS NULL;

-- Make fuel_source NOT NULL with default value
ALTER TABLE public.fuel_logs 
ALTER COLUMN fuel_source SET DEFAULT 'retail_station'::fuel_source,
ALTER COLUMN fuel_source SET NOT NULL;