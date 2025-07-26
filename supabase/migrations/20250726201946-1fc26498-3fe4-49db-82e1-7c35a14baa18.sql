-- Drop ALL foreign key constraints in the database first
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop ALL foreign key constraints
    FOR constraint_record IN 
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || constraint_record.table_name || 
                ' DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint % from table %', 
                     constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;
END $$;

-- Drop all policies that reference user columns
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (tablename = 'user_roles' OR tablename = 'profiles')
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON public.' || policy_record.tablename;
        RAISE NOTICE 'Dropped policy % from table %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- Now change ALL user-related columns to text type
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE public.user_roles 
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Critical tables causing 5-second delays
ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Re-enable public access policies
CREATE POLICY "Public access" ON public.user_roles FOR ALL USING (true);
CREATE POLICY "Public access" ON public.profiles FOR ALL USING (true);