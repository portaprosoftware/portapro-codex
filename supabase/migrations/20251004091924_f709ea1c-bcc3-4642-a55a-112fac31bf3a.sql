-- Add new fields to pm_templates table for enhanced functionality
ALTER TABLE pm_templates
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'mileage',
ADD COLUMN IF NOT EXISTS trigger_interval INTEGER,
ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS estimated_labor_hours NUMERIC(5,2);

-- Add comment to document the trigger types
COMMENT ON COLUMN pm_templates.trigger_type IS 'Type of maintenance trigger: mileage, time, engine_hours, job_count, or pump_hours';
COMMENT ON COLUMN pm_templates.trigger_interval IS 'Interval value for the trigger (e.g., 5000 for miles, 90 for days)';
COMMENT ON COLUMN pm_templates.estimated_cost IS 'Estimated cost in dollars for this maintenance';
COMMENT ON COLUMN pm_templates.estimated_labor_hours IS 'Estimated labor hours required';