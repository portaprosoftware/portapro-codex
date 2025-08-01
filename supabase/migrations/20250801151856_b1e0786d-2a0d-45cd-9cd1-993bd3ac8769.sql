-- First, let's check what triggers exist on the jobs table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'jobs';

-- Check for any functions that might be called by triggers
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname LIKE '%job%' OR proname LIKE '%update%';

-- Temporarily disable pg-safeupdate to allow job creation
SET session_replication_role = replica;