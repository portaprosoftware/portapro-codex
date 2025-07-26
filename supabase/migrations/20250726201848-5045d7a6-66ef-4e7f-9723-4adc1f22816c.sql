-- Drop the specific foreign key constraint first
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_profiles;

-- Drop all policies from user_roles 
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON public.user_roles';
    END LOOP;
END $$;

-- Change profiles table first
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

-- Now change user_roles table
ALTER TABLE public.user_roles 
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Change the critical driver tables causing the 5-second delays
ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Add back a simple public access policy
CREATE POLICY "Public access to user roles" ON public.user_roles 
FOR ALL USING (true);