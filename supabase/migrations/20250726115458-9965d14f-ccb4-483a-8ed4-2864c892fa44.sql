-- Remove placeholder maintenance records
DELETE FROM maintenance_records WHERE description LIKE 'Routine oil change and filter replacement%';

-- Remove any other placeholder maintenance records that might exist
DELETE FROM maintenance_records WHERE description = 'scheduled maintenance';

-- Remove any maintenance records with obviously placeholder vehicle references
-- (This will help clean up migrated test data)
DELETE FROM maintenance_records WHERE vehicle_id IS NULL OR vehicle_id NOT IN (SELECT id FROM vehicles);