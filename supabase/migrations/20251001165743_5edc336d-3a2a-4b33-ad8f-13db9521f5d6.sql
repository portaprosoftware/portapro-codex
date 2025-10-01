-- Enhance decon_logs table for comprehensive compliance tracking

-- Add environmental and context columns
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS weather_conditions TEXT;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS weather_details TEXT;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS location_type TEXT;

-- Change vehicle_area to array for multi-select
ALTER TABLE decon_logs DROP COLUMN IF EXISTS vehicle_area;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS vehicle_areas TEXT[] DEFAULT '{}';

-- Add structured PPE tracking
ALTER TABLE decon_logs DROP COLUMN IF EXISTS ppe_used;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS ppe_items TEXT[] DEFAULT '{}';
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS ppe_compliance_status BOOLEAN DEFAULT true;

-- Change decon_method to array for multi-select
ALTER TABLE decon_logs DROP COLUMN IF EXISTS decon_method;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS decon_methods TEXT[] DEFAULT '{}';

-- Add effectiveness and verification columns
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS post_inspection_status TEXT;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS inspector_signature TEXT;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS inspector_clerk_id TEXT;

-- Add vehicle_id if not exists
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);

-- Add comment explaining the enhancement
COMMENT ON TABLE decon_logs IS 'Enhanced decontamination logs with comprehensive compliance tracking including environmental conditions, structured PPE tracking, multi-select methods, and verification status';