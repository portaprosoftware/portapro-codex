-- ============================================
-- PHASE 4: Multi-Tenant Data Validation
-- ============================================
-- This migration creates runtime guards to prevent NULL organization_id insertions
-- across all 222 tables in the database, ensuring complete multi-tenant data isolation.

-- Create the validation function
CREATE OR REPLACE FUNCTION prevent_null_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id cannot be NULL for table %. Multi-tenant data isolation requires organization_id to be set.', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with organization_id column
-- This ensures runtime validation across the entire database

DO $$
DECLARE
  table_record RECORD;
  trigger_name TEXT;
BEGIN
  -- Loop through all tables in public schema that have organization_id column
  FOR table_record IN 
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'organization_id'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
    ORDER BY table_name
  LOOP
    -- Generate trigger name
    trigger_name := 'enforce_organization_id_' || table_record.table_name;
    
    -- Drop trigger if it exists (for idempotency)
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, table_record.table_name);
    
    -- Create trigger
    EXECUTE format(
      'CREATE TRIGGER %I
       BEFORE INSERT OR UPDATE ON %I
       FOR EACH ROW
       EXECUTE FUNCTION prevent_null_organization_id()',
      trigger_name,
      table_record.table_name
    );
    
    RAISE NOTICE 'Created trigger % on table %', trigger_name, table_record.table_name;
  END LOOP;
END $$;

-- Create index on organization_id for all tables if not exists (performance optimization)
DO $$
DECLARE
  table_record RECORD;
  index_name TEXT;
BEGIN
  FOR table_record IN 
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'organization_id'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
    ORDER BY table_name
  LOOP
    index_name := 'idx_' || table_record.table_name || '_organization_id';
    
    -- Create index if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = table_record.table_name 
      AND indexname = index_name
    ) THEN
      EXECUTE format(
        'CREATE INDEX %I ON %I (organization_id)',
        index_name,
        table_record.table_name
      );
      RAISE NOTICE 'Created index % on table %', index_name, table_record.table_name;
    ELSE
      RAISE NOTICE 'Index % already exists on table %', index_name, table_record.table_name;
    END IF;
  END LOOP;
END $$;

-- Verification: Count tables with triggers
DO $$
DECLARE
  trigger_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count triggers created
  SELECT COUNT(DISTINCT trigger_name) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'enforce_organization_id_%';
    
  -- Count tables with organization_id
  SELECT COUNT(DISTINCT table_name) INTO table_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'organization_id';
    
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Multi-Tenant Validation Summary:';
  RAISE NOTICE '  - Tables with organization_id: %', table_count;
  RAISE NOTICE '  - Triggers created: %', trigger_count;
  RAISE NOTICE '  - Validation: %', 
    CASE WHEN trigger_count = table_count 
      THEN '✅ ALL TABLES PROTECTED' 
      ELSE '⚠️ MISMATCH DETECTED' 
    END;
  RAISE NOTICE '============================================';
END $$;