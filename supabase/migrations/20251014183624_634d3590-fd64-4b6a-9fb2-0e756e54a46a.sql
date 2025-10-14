-- Add status column to maintenance_updates table for work order tracking
ALTER TABLE maintenance_updates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'work_order_created';

-- Add a comment to document the valid status values
COMMENT ON COLUMN maintenance_updates.status IS 'Valid values: work_order_created, in_progress, waiting_on_parts, completed';

-- Create index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_maintenance_updates_status ON maintenance_updates(status);