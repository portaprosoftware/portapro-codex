-- COMPREHENSIVE RLS CLEANUP - Phase 1: Remove ALL policies from ALL tables
-- This fixes the "UPDATE requires a WHERE clause" error and inconsistent RLS state

-- First, get all tables with RLS enabled and disable them systematically
DO $$
DECLARE
    table_record RECORD;
    policy_record RECORD;
BEGIN
    -- Step 1: Drop ALL policies from ALL tables in public schema
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                         policy_record.policyname, 
                         policy_record.schemaname, 
                         policy_record.tablename);
            RAISE NOTICE 'Dropped policy % from table %', policy_record.policyname, policy_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to drop policy % from table %: %', policy_record.policyname, policy_record.tablename, SQLERRM;
        END;
    END LOOP;

    -- Step 2: Disable RLS on ALL tables in public schema
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_record.tablename);
            RAISE NOTICE 'Disabled RLS on table %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to disable RLS on table %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;

    -- Step 3: Verify no policies remain
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public') THEN
        RAISE WARNING 'Some policies still exist in public schema after cleanup';
    ELSE
        RAISE NOTICE 'All RLS policies successfully removed from public schema';
    END IF;
END $$;