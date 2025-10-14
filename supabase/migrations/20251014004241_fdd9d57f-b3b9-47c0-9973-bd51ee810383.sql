-- Add pin_inventory_assignments column to jobs table
ALTER TABLE jobs 
ADD COLUMN pin_inventory_assignments jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN jobs.pin_inventory_assignments IS 
'Inventory quantities assigned to specific reference pins - array of {pin_id, product_id, quantity} objects for driver reference';