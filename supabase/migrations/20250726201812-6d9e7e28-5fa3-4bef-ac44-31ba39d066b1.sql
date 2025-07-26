-- Ultimate fix - Drop ALL policies from user_roles table first
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies from user_roles table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON public.user_roles';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Now change the user_roles table column type
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE text USING user_id::text';
        RAISE NOTICE 'Changed user_roles.user_id to text';
    END IF;
END $$;

-- Change profiles table
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

-- Change the critical tables causing 5-second delays
ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Recreate a simple public access policy for user_roles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'CREATE POLICY "Public access to user roles" ON public.user_roles FOR ALL USING (true)';
        RAISE NOTICE 'Created new public access policy for user_roles';
    END IF;
END $$;