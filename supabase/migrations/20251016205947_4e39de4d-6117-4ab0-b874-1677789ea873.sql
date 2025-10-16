-- Add 'owner' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'owner';

COMMENT ON TYPE app_role IS 'Updated to include owner role for full system access';