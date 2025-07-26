-- Fix driver_id column types from uuid to text to support Clerk user IDs
-- Step 1: Drop foreign key constraints that reference profiles.id

-- Drop foreign key from jobs table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_driver_id_fkey' 
               AND table_name = 'jobs') THEN
        ALTER TABLE public.jobs DROP CONSTRAINT jobs_driver_id_fkey;
    END IF;
END $$;

-- Step 2: Change all user/driver ID columns to text type
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.maintenance_records 
ALTER COLUMN technician_id TYPE text USING technician_id::text;

ALTER TABLE public.fuel_logs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.vehicle_assignments 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.location_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.customer_interaction_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.job_consumables 
ALTER COLUMN used_by TYPE text USING used_by::text;

-- Update user_roles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE text USING user_id::text';
    END IF;
END $$;

-- Update any other user reference columns
ALTER TABLE public.consumables 
ALTER COLUMN created_by TYPE text USING created_by::text;

ALTER TABLE public.purchase_orders 
ALTER COLUMN created_by TYPE text USING created_by::text,
ALTER COLUMN received_by TYPE text USING received_by::text;

ALTER TABLE public.saved_buttons 
ALTER COLUMN created_by TYPE text USING created_by::text;

-- Update other tables with user references
DO $$
BEGIN
    -- Update daily_vehicle_assignments if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_vehicle_assignments') THEN
        EXECUTE 'ALTER TABLE public.daily_vehicle_assignments ALTER COLUMN driver_id TYPE text USING driver_id::text';
    END IF;
    
    -- Update driver_working_hours if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_working_hours') THEN
        EXECUTE 'ALTER TABLE public.driver_working_hours ALTER COLUMN driver_id TYPE text USING driver_id::text';
    END IF;
END $$;