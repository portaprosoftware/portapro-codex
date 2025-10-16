-- Add index on user_roles.user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Add helpful comment
COMMENT ON INDEX idx_user_roles_user_id IS 'Improves lookup performance when querying user roles by profile ID';