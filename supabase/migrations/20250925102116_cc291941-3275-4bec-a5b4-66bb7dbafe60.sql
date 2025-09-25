-- Add a temporary constraint that allows both 'available' and 'active'
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Add constraint that includes both old and new values
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check 
CHECK (status = ANY (ARRAY['available'::text, 'active'::text, 'in_service'::text, 'maintenance'::text, 'out_of_service'::text, 'retired'::text]));

-- Update all vehicles with status 'available' to 'active'
UPDATE vehicles 
SET status = 'active' 
WHERE status = 'available';

-- Now update the constraint to only allow the new values
ALTER TABLE vehicles DROP CONSTRAINT vehicles_status_check;

-- Final constraint without 'available'
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'in_service'::text, 'maintenance'::text, 'out_of_service'::text, 'retired'::text]));