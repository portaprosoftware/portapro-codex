-- Add soft delete support to vehicle_spill_kit_checks
ALTER TABLE public.vehicle_spill_kit_checks 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Create index for filtering non-deleted records
CREATE INDEX IF NOT EXISTS idx_vehicle_spill_kit_checks_deleted_at 
ON public.vehicle_spill_kit_checks(deleted_at) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.vehicle_spill_kit_checks.deleted_at IS 'Soft delete timestamp - null means record is active';