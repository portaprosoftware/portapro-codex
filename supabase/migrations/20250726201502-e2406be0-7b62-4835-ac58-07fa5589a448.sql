-- Fix UUID/Text type mismatch issue - Step by step approach
-- Drop all foreign key constraints first, then change types

-- Drop all foreign key constraints that reference profiles.id
DO $$
BEGIN
    -- Drop jobs driver_id foreign key if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_driver_id_fkey' 
               AND table_name = 'jobs') THEN
        ALTER TABLE public.jobs DROP CONSTRAINT jobs_driver_id_fkey;
    END IF;
    
    -- Drop user_roles foreign key if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_user_roles_profiles' 
               AND table_name = 'user_roles') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT fk_user_roles_profiles;
    END IF;
    
    -- Drop any other foreign keys that reference profiles
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'profiles_id_fkey') THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey';
    END IF;
END $$;

-- Now change all column types to text
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

-- Change user_roles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE text USING user_id::text';
    END IF;
END $$;

-- Change all driver/user ID columns to text
ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.fuel_logs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.vehicle_assignments 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.location_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.customer_interaction_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Change other user reference columns
ALTER TABLE public.consumables 
ALTER COLUMN created_by TYPE text USING created_by::text;

ALTER TABLE public.purchase_orders 
ALTER COLUMN created_by TYPE text USING created_by::text,
ALTER COLUMN received_by TYPE text USING received_by::text;

ALTER TABLE public.job_consumables 
ALTER COLUMN used_by TYPE text USING used_by::text;

ALTER TABLE public.maintenance_records 
ALTER COLUMN technician_id TYPE text USING technician_id::text;