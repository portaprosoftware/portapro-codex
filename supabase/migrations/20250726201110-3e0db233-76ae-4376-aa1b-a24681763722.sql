-- Fix driver_id column types from uuid to text to support Clerk user IDs
-- This will resolve 5-second loading delays on driver pages

-- Update jobs table
ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Update driver_time_off_requests table  
ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Update maintenance_records table
ALTER TABLE public.maintenance_records 
ALTER COLUMN technician_id TYPE text USING technician_id::text;

-- Update fuel_logs table
ALTER TABLE public.fuel_logs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Update vehicle_assignments table
ALTER TABLE public.vehicle_assignments 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Update daily_vehicle_assignments table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_vehicle_assignments') THEN
        EXECUTE 'ALTER TABLE public.daily_vehicle_assignments ALTER COLUMN driver_id TYPE text USING driver_id::text';
    END IF;
END $$;

-- Update location_logs table
ALTER TABLE public.location_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Update customer_interaction_logs table
ALTER TABLE public.customer_interaction_logs 
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Update job_consumables table
ALTER TABLE public.job_consumables 
ALTER COLUMN used_by TYPE text USING used_by::text;

-- Update any other tables that might have user/driver ID references
-- Update profiles table to match
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

-- Update user_roles table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE text USING user_id::text';
    END IF;
END $$;