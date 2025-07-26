-- Comprehensive fix for UUID/Text type mismatch
-- First, find and drop ALL foreign key constraints that reference profiles.id

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints that reference profiles.id
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
        RAISE NOTICE 'Dropped constraint % from table %', 
                     constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;
END $$;

-- Now change profiles.id to text
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE text USING id::text;

-- Change all other tables with user ID references
-- First the main driver tables causing the 5-second delay
ALTER TABLE public.jobs 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

ALTER TABLE public.driver_time_off_requests 
ALTER COLUMN driver_id TYPE text USING driver_id::text;

-- Update user_roles table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE 'ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE text USING user_id::text';
    END IF;
END $$;

-- Update all other tables with user references
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

ALTER TABLE public.consumables 
ALTER COLUMN created_by TYPE text USING created_by::text;

ALTER TABLE public.purchase_orders 
ALTER COLUMN created_by TYPE text USING created_by::text,
ALTER COLUMN received_by TYPE text USING received_by::text;

ALTER TABLE public.job_consumables 
ALTER COLUMN used_by TYPE text USING used_by::text;

ALTER TABLE public.maintenance_records 
ALTER COLUMN technician_id TYPE text USING technician_id::text,
ALTER COLUMN created_by TYPE text USING created_by::text;

ALTER TABLE public.saved_buttons 
ALTER COLUMN created_by TYPE text USING created_by::text;