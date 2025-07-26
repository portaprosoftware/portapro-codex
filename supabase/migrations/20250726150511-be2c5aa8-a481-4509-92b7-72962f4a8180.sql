-- First drop the existing constraint
ALTER TABLE vehicles DROP CONSTRAINT vehicles_status_check;

-- Update 'active' status to 'available' 
UPDATE vehicles 
SET status = 'available' 
WHERE status = 'active';

-- Add updated constraint that includes 'available' and 'in_service'
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check 
CHECK (status = ANY (ARRAY['available', 'in_service', 'maintenance', 'out_of_service', 'retired']));