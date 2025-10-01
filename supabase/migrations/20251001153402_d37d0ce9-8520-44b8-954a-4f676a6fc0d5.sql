-- Add 'near_miss' to incident_severity enum
ALTER TYPE incident_severity ADD VALUE IF NOT EXISTS 'near_miss';

-- Migrate any existing 'reportable' severity incidents to 'major' and set their regulatory flag
-- This ensures data consistency as 'reportable' is now a separate checkbox
UPDATE public.spill_incident_reports
SET 
  severity = 'major',
  regulatory_notification_required = true
WHERE severity = 'reportable';

-- Add comment for documentation
COMMENT ON TYPE incident_severity IS 'Incident severity levels: near_miss (no actual spill), minor (small/contained), moderate (cleanup required), major (significant impact), reportable (deprecated - use regulatory_notification_required flag instead)';

-- Add comment for responsible_party column
COMMENT ON COLUMN public.spill_incident_reports.responsible_party IS 'Values: driver, customer, contractor, company_internal, third_party_transporter, environmental_external, unknown';
