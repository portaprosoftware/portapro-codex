-- Update 'active' status to 'available' for consistency
UPDATE vehicles 
SET status = 'available' 
WHERE status = 'active';