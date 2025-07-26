-- Remove foreign key constraint that requires profiles.id to match auth.users.id
-- This is needed because the application uses Clerk for authentication, not Supabase Auth
-- The constraint was preventing user creation with random UUIDs

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add a comment to document this change
COMMENT ON TABLE public.profiles IS 'User profiles table - uses Clerk authentication instead of Supabase Auth';