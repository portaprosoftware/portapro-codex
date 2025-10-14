-- Add reference_pin_ids column to jobs table for storing selected GPS reference pins
ALTER TABLE jobs 
ADD COLUMN reference_pin_ids jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN jobs.reference_pin_ids IS 
'Array of customer_map_pins IDs selected for reference - does not affect routing or mapping';