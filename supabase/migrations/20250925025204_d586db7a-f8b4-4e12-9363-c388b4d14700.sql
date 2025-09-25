-- Ensure maintenance_records table is properly configured
-- Drop and recreate any problematic triggers/functions

-- Check if there are any triggers that might be causing issues
DROP TRIGGER IF EXISTS maintenance_records_trigger ON maintenance_records;
DROP FUNCTION IF EXISTS maintenance_records_trigger_function();

-- Make sure the table structure is correct
DO $$ 
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'notification_trigger_type') THEN
    ALTER TABLE maintenance_records ADD COLUMN notification_trigger_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'task_type_id') THEN
    ALTER TABLE maintenance_records ADD COLUMN task_type_id UUID REFERENCES maintenance_task_types(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'vendor_id') THEN
    ALTER TABLE maintenance_records ADD COLUMN vendor_id UUID REFERENCES maintenance_vendors(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_records' AND column_name = 'priority') THEN
    ALTER TABLE maintenance_records ADD COLUMN priority TEXT;
  END IF;
END $$;

-- Ensure RLS is disabled (already confirmed but let's be sure)
ALTER TABLE maintenance_records DISABLE ROW LEVEL SECURITY;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_scheduled_date ON maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);