-- Fix duplicate foreign key relationships causing 400 errors in profiles/user_roles queries

-- Drop any duplicate constraints that might exist between profiles and user_roles
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey1;

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey2;

-- Drop any extra constraints
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS fk_user_roles_profiles;