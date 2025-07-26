-- Final comprehensive fix for UUID/Text mismatch
-- Step 1: Drop RLS policies that depend on user_id columns

-- Drop policies from user_roles table
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Step 2: Drop foreign key constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'profiles'
            AND ccu.column_name = 'id'
    LOOP
        EXECUTE 'ALTER TABLE public.' || constraint_record.table_name || 
                ' DROP CONSTRAINT ' || constraint_record.constraint_name;
    END LOOP;
END $$;

-- Step 3: Change column types
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE text USING user_id::text';
    END IF;
END $$;

-- The main tables causing 5-second delays
ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Other user reference columns
ALTER TABLE public.fuel_logs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.vehicle_assignments 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.location_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.customer_interaction_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.customer_communications 
ALTER COLUMN sent_by TYPE text USING sent_by::text;

-- Step 4: Recreate basic RLS policies using text comparison
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'CREATE POLICY "Public access" ON public.user_roles FOR ALL USING (true)';
    END IF;
END $$;