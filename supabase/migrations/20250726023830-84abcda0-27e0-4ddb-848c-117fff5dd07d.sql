-- Remove foreign key constraint from user_roles table that requires user_id to match auth.users.id
-- This is needed because the application uses Clerk for authentication, not Supabase Auth
-- The constraint was preventing user role creation with random UUIDs

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add a comment to document this change
COMMENT ON TABLE public.user_roles IS 'User roles table - uses Clerk authentication instead of Supabase Auth';