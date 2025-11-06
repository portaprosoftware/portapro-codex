-- Direct test - no IF NOT EXISTS
ALTER TABLE automation_requests ADD COLUMN organization_id TEXT;

-- Verify it worked
SELECT 'organization_id column added' as status;