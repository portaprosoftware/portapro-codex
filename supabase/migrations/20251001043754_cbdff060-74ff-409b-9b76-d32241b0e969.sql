-- Add soft delete columns to spill_incident_reports
ALTER TABLE public.spill_incident_reports
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Create index for filtering non-deleted records
CREATE INDEX IF NOT EXISTS idx_spill_incident_reports_deleted_at 
ON public.spill_incident_reports(deleted_at) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.spill_incident_reports.deleted_at IS 'Timestamp when incident was soft deleted';
COMMENT ON COLUMN public.spill_incident_reports.deleted_by IS 'Clerk user ID who deleted the incident';